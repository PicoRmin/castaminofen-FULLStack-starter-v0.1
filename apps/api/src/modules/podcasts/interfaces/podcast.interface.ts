export interface PodcastSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published';
}
