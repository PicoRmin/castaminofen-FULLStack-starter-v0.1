import type { FeedDto, EpisodeDto } from '../../dto';
import type { NamespaceMetadata } from '../namespaces';

export interface AuthorModel {
  readonly name: string;
  readonly email?: string;
  readonly uri?: string;
}

export interface CategoryModel {
  readonly term: string;
  readonly scheme?: string;
  readonly label?: string;
}

export interface LinkModel {
  readonly href: string;
  readonly rel?: string;
  readonly type?: string;
  readonly title?: string;
}

export interface ImageModel {
  readonly url: string;
  readonly title?: string;
  readonly link?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface MetadataModel {
  readonly unknownNamespaces: readonly NamespaceMetadata[];
  readonly unknownElements: readonly string[];
  readonly unknownAttributes: readonly string[];
  readonly custom: Record<string, unknown>;
}

export interface EpisodeModel {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly link?: string;
  readonly publishedAt?: string;
  readonly authors: readonly AuthorModel[];
  readonly categories: readonly CategoryModel[];
  readonly image?: ImageModel;
  readonly duration?: string;
  readonly explicit?: boolean;
  readonly mediaUrl?: string;
  readonly metadata: MetadataModel;
}

export interface FeedModel {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly link?: string;
  readonly language?: string;
  readonly copyright?: string;
  readonly updatedAt?: string;
  readonly generator?: string;
  readonly categories: readonly CategoryModel[];
  readonly authors: readonly AuthorModel[];
  readonly image?: ImageModel;
  readonly links: readonly LinkModel[];
  readonly episodes: readonly EpisodeModel[];
  readonly metadata: MetadataModel;
}

export interface DtoMapperContract {
  mapFeed(model: FeedModel): FeedDto;
  mapEpisode(model: EpisodeModel): EpisodeDto;
}
