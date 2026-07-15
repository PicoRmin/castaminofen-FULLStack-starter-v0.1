export class CreatePodcastDto {
  title!: string;
  slug!: string;
  description?: string;
  status: 'draft' | 'published' = 'draft';
}
