export class UpdatePodcastDto {
  title?: string;
  slug?: string;
  description?: string;
  status?: 'draft' | 'published';
}
