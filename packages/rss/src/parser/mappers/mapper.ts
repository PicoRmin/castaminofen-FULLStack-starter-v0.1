import type { FeedDto, EpisodeDto } from '../../dto';
import type { DtoMapperContract, EpisodeModel, FeedModel } from './types';
import { DtoMappingError } from './errors';

export class DtoMapper implements DtoMapperContract {
  public mapFeed(model: FeedModel): FeedDto {
    try {
      return {
        id: this.normalizeIdentifier(model.id),
        title: this.normalizeText(model.title),
        description: this.normalizeText(model.description),
        link: this.normalizeUrl(model.link),
        language: this.normalizeLanguage(model.language),
        copyright: this.normalizeText(model.copyright),
        updatedAt: this.normalizeDate(model.updatedAt),
        generator: this.normalizeText(model.generator),
        categories: this.normalizeCategories(model.categories),
        authors: this.normalizeAuthors(model.authors),
        image: model.image ? this.normalizeImage(model.image) : undefined,
        links: model.links.map((link) => this.normalizeLink(link)),
        episodes: model.episodes.map((episode) => this.mapEpisode(episode)),
        metadata: this.normalizeMetadata(model.metadata),
      } as FeedDto;
    } catch (error) {
      throw new DtoMappingError('Failed to map feed model.', { cause: error });
    }
  }

  public mapEpisode(model: EpisodeModel): EpisodeDto {
    try {
      return {
        id: this.normalizeIdentifier(model.id),
        title: this.normalizeText(model.title),
        description: this.normalizeText(model.description),
        link: this.normalizeUrl(model.link),
        publishedAt: this.normalizeDate(model.publishedAt),
        authors: this.normalizeAuthors(model.authors),
        categories: this.normalizeCategories(model.categories),
        image: model.image ? this.normalizeImage(model.image) : undefined,
        duration: this.normalizeDuration(model.duration),
        explicit: this.normalizeBoolean(model.explicit),
        mediaUrl: this.normalizeUrl(model.mediaUrl),
        metadata: this.normalizeMetadata(model.metadata),
      } as EpisodeDto;
    } catch (error) {
      throw new DtoMappingError('Failed to map episode model.', { cause: error });
    }
  }

  private normalizeIdentifier(value?: string): string | undefined {
    return value?.trim() ? value.trim() : undefined;
  }

  private normalizeText(value?: string): string | undefined {
    return value?.trim() ? value.trim() : undefined;
  }

  private normalizeUrl(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return trimmed.replace(/\s+/g, '');
  }

  private normalizeLanguage(value?: string): string | undefined {
    return value?.trim().toLowerCase() || undefined;
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? trimmed : new Date(parsed).toISOString();
  }

  private normalizeDuration(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  private normalizeBoolean(value?: boolean): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private normalizeCategories(
    categories: readonly { term: string; scheme?: string; label?: string }[],
  ): Array<{ term: string; scheme?: string; label?: string }> {
    return categories
      .map((category) => {
        const normalized: { term: string; scheme?: string; label?: string } = {
          term: this.normalizeIdentifier(category.term) ?? '',
        };

        const scheme = this.normalizeText(category.scheme);
        if (scheme) {
          normalized.scheme = scheme;
        }

        const label = this.normalizeText(category.label);
        if (label) {
          normalized.label = label;
        }

        return normalized;
      })
      .filter((category) => Boolean(category.term));
  }

  private normalizeAuthors(
    authors: readonly { name: string; email?: string; uri?: string }[],
  ): Array<{ name: string; email?: string; uri?: string }> {
    return authors
      .map((author) => {
        const normalized: { name: string; email?: string; uri?: string } = {
          name: this.normalizeText(author.name) ?? '',
        };

        const email = this.normalizeText(author.email);
        if (email) {
          normalized.email = email;
        }

        const uri = this.normalizeUrl(author.uri);
        if (uri) {
          normalized.uri = uri;
        }

        return normalized;
      })
      .filter((author) => Boolean(author.name));
  }

  private normalizeImage(image: {
    url: string;
    title?: string;
    link?: string;
    width?: number;
    height?: number;
  }): { url: string; title?: string; link?: string; width?: number; height?: number } {
    const normalized: {
      url: string;
      title?: string;
      link?: string;
      width?: number;
      height?: number;
    } = {
      url: this.normalizeUrl(image.url) ?? '',
    };

    const title = this.normalizeText(image.title);
    if (title) {
      normalized.title = title;
    }

    const link = this.normalizeUrl(image.link);
    if (link) {
      normalized.link = link;
    }

    if (typeof image.width === 'number') {
      normalized.width = image.width;
    }

    if (typeof image.height === 'number') {
      normalized.height = image.height;
    }

    return normalized;
  }

  private normalizeLink(link: { href: string; rel?: string; type?: string; title?: string }): {
    href: string;
    rel?: string;
    type?: string;
    title?: string;
  } {
    const normalized: { href: string; rel?: string; type?: string; title?: string } = {
      href: this.normalizeUrl(link.href) ?? '',
    };

    const rel = this.normalizeText(link.rel);
    if (rel) {
      normalized.rel = rel;
    }

    const type = this.normalizeText(link.type);
    if (type) {
      normalized.type = type;
    }

    const title = this.normalizeText(link.title);
    if (title) {
      normalized.title = title;
    }

    return normalized;
  }

  private normalizeMetadata(metadata: {
    unknownNamespaces: readonly unknown[];
    unknownElements: readonly string[];
    unknownAttributes: readonly string[];
    custom: Record<string, unknown>;
  }): {
    unknownNamespaces: readonly unknown[];
    unknownElements: readonly string[];
    unknownAttributes: readonly string[];
    custom: Record<string, unknown>;
  } {
    return {
      unknownNamespaces: metadata.unknownNamespaces,
      unknownElements: metadata.unknownElements,
      unknownAttributes: metadata.unknownAttributes,
      custom: { ...metadata.custom },
    };
  }
}
