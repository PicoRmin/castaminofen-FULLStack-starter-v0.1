import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Meilisearch } from 'meilisearch';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '../../common/config/config.service';

export interface SearchQueryOptions {
  readonly type?: 'podcast' | 'episode' | 'channel' | 'category';
  readonly categoryId?: string;
  readonly channelId?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly userId?: string;
}

interface PodcastSearchResult {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string | null;
  readonly coverUrl: string | null;
  readonly channel: string | null;
  readonly category: string | null;
}

interface EpisodeSearchResult {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string | null;
  readonly podcastSlug: string | null;
}

interface ChannelSearchResult {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
}

interface CategorySearchResult {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface SearchResponse {
  readonly query: string;
  readonly podcasts: PodcastSearchResult[];
  readonly episodes: EpisodeSearchResult[];
  readonly channels: ChannelSearchResult[];
  readonly categories: CategorySearchResult[];
  readonly suggestions: string[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly config = new ConfigService();
  private readonly meiliClient?: Meilisearch;
  private readonly useMeili: boolean;

  constructor(private readonly prisma: PrismaService) {
    const meiliHost = this.config.get<string>('MEILISEARCH_HOST');
    if (meiliHost) {
      const apiKey = this.config.get<string>('MEILISEARCH_API_KEY');
      this.meiliClient = new Meilisearch({
        host: meiliHost,
        ...(apiKey ? { apiKey } : {}),
      });
      this.useMeili = true;
    } else {
      this.useMeili = false;
    }
  }

  private normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }

  private buildMeiliFilter(options: SearchQueryOptions): string | undefined {
    const filters = [];
    if (options.categoryId) {
      filters.push(`categoryId = \"${options.categoryId}\"`);
    }
    if (options.channelId) {
      filters.push(`channelId = \"${options.channelId}\"`);
    }
    return filters.length ? filters.join(' AND ') : undefined;
  }

  private buildTsQuery(query: string): string {
    const terms = query
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `${term}:*`);

    return terms.length ? terms.join(' & ') : '';
  }

  private async expandSynonyms(query: string): Promise<string> {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return query;
    }

    const synonyms = await this.prisma.searchSynonym.findMany({
      where: {
        OR: [{ source: normalized }, { target: normalized }],
      },
    });

    const terms = new Set([normalized]);
    for (const synonym of synonyms) {
      terms.add(synonym.source);
      terms.add(synonym.target);
    }

    return Array.from(terms).join(' | ');
  }

  private countResults(results: SearchResponse): number {
    return (
      results.podcasts.length +
      results.episodes.length +
      results.channels.length +
      results.categories.length
    );
  }

  async search(query: string, options: SearchQueryOptions = {}): Promise<SearchResponse> {
    const normalizedQuery = this.normalizeQuery(query);
    const limit = options.limit ?? 10;
    const page = Math.max(1, options.page ?? 1);
    const offset = (page - 1) * limit;

    let results: Omit<SearchResponse, 'query' | 'suggestions'> = {
      podcasts: [],
      episodes: [],
      channels: [],
      categories: [],
    };

    if (!normalizedQuery) {
      results = await this.fetchTrending(limit, options);
    } else {
      const searchTerm = await this.expandSynonyms(normalizedQuery);
      if (this.useMeili) {
        try {
          results = await this.searchWithMeilisearch(searchTerm, { ...options, page, limit });
        } catch (error) {
          this.logger.warn(
            `Meilisearch failed, falling back to Postgres search: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          results = await this.searchWithPostgres(normalizedQuery, { ...options, page, limit });
        }
      } else {
        results = await this.searchWithPostgres(normalizedQuery, { ...options, page, limit });
      }

      await this.recordRecentSearch(options.userId, normalizedQuery);
      const analyticsFilters: Pick<SearchQueryOptions, 'type' | 'categoryId' | 'channelId'> = {
        ...(options.type !== undefined ? { type: options.type } : {}),
        ...(options.categoryId !== undefined ? { categoryId: options.categoryId } : {}),
        ...(options.channelId !== undefined ? { channelId: options.channelId } : {}),
      };

      await this.recordSearchAnalytics(
        options.userId,
        normalizedQuery,
        this.countResults({
          query: normalizedQuery,
          ...results,
          suggestions: [],
        }),
        analyticsFilters,
      );
    }

    const suggestions = await this.getSuggestions(normalizedQuery, options.userId);
    return { query: normalizedQuery, ...results, suggestions };
  }

  async autocomplete(query: string, userId?: string, limit = 8): Promise<string[]> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return this.getRecentSearches(userId, limit);
    }

    if (this.useMeili) {
      try {
        return await this.autocompleteWithMeilisearch(normalizedQuery, limit, userId);
      } catch (error) {
        this.logger.warn(
          `Meilisearch autocomplete failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return this.autocompleteWithPostgres(normalizedQuery, limit, userId);
  }

  async getSuggestions(query: string, userId?: string): Promise<string[]> {
    const normalizedQuery = this.normalizeQuery(query);
    const suggestions = new Set<string>();

    if (normalizedQuery) {
      const autocompleteSuggestions = await this.autocomplete(normalizedQuery, userId, 8);
      autocompleteSuggestions.forEach((item) => suggestions.add(item));
    }

    const recent = await this.getRecentSearches(userId, 8);
    recent.forEach((item) => suggestions.add(item));

    return Array.from(suggestions).slice(0, 8);
  }

  async getRecentSearches(userId?: string, limit = 10): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const recent = await this.prisma.searchRecentQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return recent.map((item) => item.query);
  }

  async getAnalytics(days = 30, limit = 20): Promise<Array<{ query: string; count: number }>> {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const analytics = await this.prisma.searchAnalyticsEvent.groupBy({
      by: ['query'],
      _count: { query: true },
      where: { createdAt: { gte: fromDate } },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return analytics.map((entry) => ({ query: entry.query, count: entry._count.query }));
  }

  private async searchWithMeilisearch(
    query: string,
    options: SearchQueryOptions & { page: number; limit: number },
  ) {
    const indexNames = [
      { type: 'podcast', index: 'podcasts' },
      { type: 'episode', index: 'episodes' },
      { type: 'channel', index: 'channels' },
      { type: 'category', index: 'categories' },
    ] as const;

    const selected = options.type
      ? indexNames.filter((entry) => entry.type === options.type)
      : indexNames;

    const filter = this.buildMeiliFilter(options);
    const tasks = selected.map(async ({ type, index }) => {
      const result = await this.meiliClient!.index(index).search<Record<string, unknown>>(query, {
        ...(filter ? { filter } : {}),
        limit: options.limit,
        offset: options.page > 1 ? (options.page - 1) * options.limit : 0,
      });

      return { type, hits: result.hits };
    });

    const responses = await Promise.all(tasks);
    return {
      podcasts:
        responses
          .find((result) => result.type === 'podcast')
          ?.hits.map((hit: Record<string, unknown>) => ({
            id: String(hit.id ?? ''),
            slug: String(hit.slug ?? ''),
            title: String(hit.title ?? ''),
            description: hit.description ? String(hit.description) : null,
            coverUrl: hit.coverUrl ? String(hit.coverUrl) : null,
            channel: hit.channel ? String(hit.channel) : null,
            category: hit.category ? String(hit.category) : null,
          })) ?? [],
      episodes:
        responses
          .find((result) => result.type === 'episode')
          ?.hits.map((hit: Record<string, unknown>) => ({
            id: String(hit.id ?? ''),
            slug: String(hit.slug ?? ''),
            title: String(hit.title ?? ''),
            description: hit.description ? String(hit.description) : null,
            podcastSlug: hit.podcastSlug ? String(hit.podcastSlug) : null,
          })) ?? [],
      channels:
        responses
          .find((result) => result.type === 'channel')
          ?.hits.map((hit: Record<string, unknown>) => ({
            id: String(hit.id ?? ''),
            slug: String(hit.slug ?? ''),
            name: String(hit.name ?? ''),
            description: hit.description ? String(hit.description) : null,
          })) ?? [],
      categories:
        responses
          .find((result) => result.type === 'category')
          ?.hits.map((hit: Record<string, unknown>) => ({
            id: String(hit.id ?? ''),
            slug: String(hit.slug ?? ''),
            name: String(hit.name ?? ''),
          })) ?? [],
    };
  }

  private async searchWithPostgres(
    query: string,
    options: SearchQueryOptions & { page: number; limit: number },
  ) {
    const conditions = [
      Prisma.sql`to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(c.name, '') || ' ' || coalesce(cat.name, '')) @@ plainto_tsquery('simple', ${query})`,
    ];

    if (options.categoryId) {
      conditions.push(Prisma.sql`p."categoryId" = ${options.categoryId}`);
    }

    if (options.channelId) {
      conditions.push(Prisma.sql`p."channelId" = ${options.channelId}`);
    }

    const queryFilter = Prisma.join(conditions, ' AND ');
    const limit = options.limit;
    const offset = (options.page - 1) * options.limit;

    const podcasts = await this.prisma.$queryRaw<PodcastSearchResult[]>`
      SELECT p.id, p.slug, p.title, p.description, p."coverUrl", c.name AS channel, cat.name AS category
      FROM podcasts p
      LEFT JOIN channels c ON c.id = p."channelId"
      LEFT JOIN categories cat ON cat.id = p."categoryId"
      WHERE ${queryFilter}
      ORDER BY ts_rank_cd(
        to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(c.name, '') || ' ' || coalesce(cat.name, '')),
        plainto_tsquery('simple', ${query})
      ) DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const episodes = await this.prisma.$queryRaw<EpisodeSearchResult[]>`
      SELECT e.id, e.slug, e.title, e.description, p.slug AS "podcastSlug"
      FROM episodes e
      JOIN podcasts p ON p.id = e."podcastId"
      WHERE to_tsvector('simple', coalesce(e.title, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(p.title, ''))
        @@ plainto_tsquery('simple', ${query})
      ${options.channelId ? Prisma.sql`AND p."channelId" = ${options.channelId}` : Prisma.sql``}
      ORDER BY ts_rank_cd(
        to_tsvector('simple', coalesce(e.title, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(p.title, '')),
        plainto_tsquery('simple', ${query})
      ) DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const channels = await this.prisma.$queryRaw<ChannelSearchResult[]>`
      SELECT id, slug, name, description
      FROM channels
      WHERE to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, '') || ' ' || coalesce(description, ''))
        @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank_cd(
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, '') || ' ' || coalesce(description, '')),
        plainto_tsquery('simple', ${query})
      ) DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const categories = await this.prisma.$queryRaw<CategorySearchResult[]>`
      SELECT id, slug, name
      FROM categories
      WHERE to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, ''))
        @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank_cd(
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, '')),
        plainto_tsquery('simple', ${query})
      ) DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    if (options.type === 'podcast') {
      return { podcasts, episodes: [], channels: [], categories: [] };
    }

    if (options.type === 'episode') {
      return { podcasts: [], episodes, channels: [], categories: [] };
    }

    if (options.type === 'channel') {
      return { podcasts: [], episodes: [], channels, categories: [] };
    }

    if (options.type === 'category') {
      return { podcasts: [], episodes: [], channels: [], categories };
    }

    return { podcasts, episodes, channels, categories };
  }

  private async fetchTrending(limit: number, options: SearchQueryOptions) {
    const [podcasts, episodes, channels, categories] = await Promise.all([
      this.prisma.podcast.findMany({
        ...(options.categoryId ? { where: { categoryId: options.categoryId } } : {}),
        include: { channel: { select: { name: true } }, category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.episode.findMany({
        ...(options.channelId ? { where: { podcast: { channelId: options.channelId } } } : {}),
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.channel.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.category.findMany({
        orderBy: { name: 'asc' },
        take: limit,
      }),
    ] as const);

    return {
      podcasts: podcasts.map((podcast) => ({
        id: podcast.id,
        slug: podcast.slug,
        title: podcast.title,
        description: podcast.description,
        coverUrl: podcast.coverUrl,
        channel: podcast.channel?.name ?? null,
        category: podcast.category?.name ?? null,
      })),
      episodes: episodes.map((episode) => ({
        id: episode.id,
        slug: episode.slug,
        title: episode.title,
        description: episode.description,
        podcastSlug: episode.podcastId,
      })),
      channels: channels.map((channel) => ({
        id: channel.id,
        slug: channel.slug,
        name: channel.name,
        description: channel.description,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
      })),
    };
  }

  private async autocompleteWithMeilisearch(query: string, limit: number, userId?: string) {
    const filter = this.buildMeiliFilter({});
    const searchParams = {
      ...(filter ? { filter } : {}),
      limit,
    };
    const [podcasts, episodes, channels, categories] = await Promise.all([
      this.meiliClient!.index('podcasts').search<{ title: string }>(query, searchParams),
      this.meiliClient!.index('episodes').search<{ title: string }>(query, searchParams),
      this.meiliClient!.index('channels').search<{ name: string }>(query, searchParams),
      this.meiliClient!.index('categories').search<{ name: string }>(query, searchParams),
    ]);

    const suggestions = new Set<string>();
    podcasts.hits.forEach((hit: { title: string }) => {
      if (hit.title) suggestions.add(hit.title);
    });
    episodes.hits.forEach((hit: { title: string }) => {
      if (hit.title) suggestions.add(hit.title);
    });
    channels.hits.forEach((hit: { name: string }) => {
      if (hit.name) suggestions.add(hit.name);
    });
    categories.hits.forEach((hit: { name: string }) => {
      if (hit.name) suggestions.add(hit.name);
    });

    const recentSearches = await this.getRecentSearches(userId, limit);
    recentSearches.forEach((item) => suggestions.add(item));

    return Array.from(suggestions).slice(0, limit);
  }

  private async autocompleteWithPostgres(query: string, limit: number, userId?: string) {
    const [podcasts, episodes, channels] = await Promise.all([
      this.prisma.podcast.findMany({
        where: { title: { startsWith: query, mode: 'insensitive' } },
        select: { title: true },
        take: limit,
      }),
      this.prisma.episode.findMany({
        where: { title: { startsWith: query, mode: 'insensitive' } },
        select: { title: true },
        take: limit,
      }),
      this.prisma.channel.findMany({
        where: { name: { startsWith: query, mode: 'insensitive' } },
        select: { name: true },
        take: limit,
      }),
    ]);

    const suggestions = new Set<string>();
    podcasts.forEach((podcast) => suggestions.add(podcast.title));
    episodes.forEach((episode) => suggestions.add(episode.title));
    channels.forEach((channel) => suggestions.add(channel.name));

    const recentSearches = await this.getRecentSearches(userId, limit);
    recentSearches.forEach((item) => suggestions.add(item));

    return Array.from(suggestions).slice(0, limit);
  }

  private async recordRecentSearch(userId: string | undefined, query: string): Promise<void> {
    if (!userId || !query) {
      return;
    }

    await this.prisma.searchRecentQuery.upsert({
      where: {
        userId_query: {
          userId,
          query,
        },
      },
      update: { createdAt: new Date() },
      create: {
        userId,
        query,
      },
    });
  }

  private async recordSearchAnalytics(
    userId: string | undefined,
    query: string,
    resultsCount: number,
    filters: Pick<SearchQueryOptions, 'type' | 'categoryId' | 'channelId'>,
  ): Promise<void> {
    if (!query) {
      return;
    }

    await this.prisma.searchAnalyticsEvent.create({
      data: {
        query,
        resultsCount,
        source: 'api',
        userId: userId ?? null,
        filters: {
          ...(filters.type !== undefined ? { type: filters.type } : {}),
          ...(filters.categoryId !== undefined ? { categoryId: filters.categoryId } : {}),
          ...(filters.channelId !== undefined ? { channelId: filters.channelId } : {}),
        },
      },
    });
  }
}
