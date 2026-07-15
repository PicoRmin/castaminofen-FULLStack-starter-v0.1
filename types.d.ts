declare module '@castaminofen/types' {
  export interface PackageConfig {
    readonly name: string;
    readonly version: string;
    readonly enabled: boolean;
  }

  export interface PackageContract {
    readonly config: PackageConfig;
    initialize(): string;
  }

  export interface EpisodeSummary {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly duration: string;
    readonly audioUrl: string;
    readonly publishedAt: string;
    readonly podcastSlug: string;
  }

  export interface PodcastSummary {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly channel: string;
    readonly description: string;
    readonly category: string;
    readonly image: string;
    readonly accent: string;
    readonly episodeCount: number;
  }

  export interface PodcastDetail extends Omit<PodcastSummary, 'episodeCount'> {
    readonly episodes: readonly EpisodeSummary[];
  }

  export interface SearchResults {
    readonly podcasts: readonly PodcastSummary[];
    readonly episodes: readonly EpisodeSummary[];
    readonly channels: readonly string[];
  }

  export interface HomeResponse {
    readonly featuredPodcasts: readonly PodcastSummary[];
    readonly latestEpisodes: readonly EpisodeSummary[];
    readonly continueListening: readonly EpisodeSummary[];
    readonly categories: readonly string[];
    readonly channels: readonly string[];
  }

  export interface RegisterPayload {
    readonly email: string;
    readonly password: string;
    readonly name?: string;
  }

  export interface AuthRegistrationResult {
    readonly userId: string;
    readonly email: string;
    readonly name: string;
    readonly status: 'active' | 'pending';
    readonly createdAt: string;
  }

  export interface UploadPayload {
    readonly fileName: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly ownerId: string;
  }

  export interface UploadResult {
    readonly assetId: string;
    readonly fileName: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly status: 'queued' | 'uploaded';
    readonly url: string;
  }

  export interface NotificationItem {
    readonly id: string;
    readonly title: string;
    readonly message: string;
    readonly createdAt: string;
    readonly isRead: boolean;
  }

  export interface UserProfile {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly role: 'listener' | 'creator' | 'admin';
    readonly displayName: string;
  }

  export class TypesService implements PackageContract {
    constructor(public readonly config: PackageConfig);
    initialize(): string;
  }

  export const packageMetadata: {
    readonly name: string;
    readonly version: string;
    readonly enabled: boolean;
  };
}
