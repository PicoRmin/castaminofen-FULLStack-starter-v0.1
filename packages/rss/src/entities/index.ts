export interface FeedEntity {
  id: string;
  url: string;
  title?: string;
}

export interface EpisodeEntity {
  id: string;
  title?: string;
  guid?: string;
}

export interface ChannelEntity {
  id: string;
  title?: string;
}
