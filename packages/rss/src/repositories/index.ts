export interface FeedRepository {
  findById(id: string): Promise<unknown>;
}

export interface EpisodeRepository {
  findById(id: string): Promise<unknown>;
}
