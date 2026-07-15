import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
  private readonly podcasts = [
    {
      id: 'pod-1',
      slug: 'maker-hour',
      title: 'Maker Hour',
      channel: 'Northstar Media',
      description: 'A practical show for builders shipping thoughtful products.',
      category: 'Technology',
      image:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
      accent: '#2563eb',
      episodes: [
        {
          id: 'ep-1',
          slug: 'launching-a-better-ux',
          title: 'Launching a Better UX',
          description: 'How the team simplified onboarding without losing depth.',
          duration: '42 min',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          publishedAt: '2026-07-10',
          podcastSlug: 'maker-hour',
        },
        {
          id: 'ep-2',
          slug: 'designing-for-focus',
          title: 'Designing for Focus',
          description: 'A conversation on calmer interfaces and better pacing.',
          duration: '38 min',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          publishedAt: '2026-07-03',
          podcastSlug: 'maker-hour',
        },
      ],
    },
    {
      id: 'pod-2',
      slug: 'city-stories',
      title: 'City Stories',
      channel: 'Beacon Collective',
      description: 'Voices from neighborhoods, cafés, and late-night trains.',
      category: 'Culture',
      image:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
      accent: '#7c3aed',
      episodes: [
        {
          id: 'ep-3',
          slug: 'the-library-after-hours',
          title: 'The Library After Hours',
          description: 'Stories from the civic spaces keeping neighborhoods alive.',
          duration: '31 min',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          publishedAt: '2026-06-28',
          podcastSlug: 'city-stories',
        },
      ],
    },
    {
      id: 'pod-3',
      slug: 'founders-at-dawn',
      title: 'Founders at Dawn',
      channel: 'Northstar Media',
      description: 'Short interviews with founders building with care.',
      category: 'Business',
      image:
        'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
      accent: '#0f766e',
      episodes: [
        {
          id: 'ep-4',
          slug: 'building-with-resilience',
          title: 'Building with Resilience',
          description: 'A founder explains how calm systems beat heroic launches.',
          duration: '45 min',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          publishedAt: '2026-06-20',
          podcastSlug: 'founders-at-dawn',
        },
      ],
    },
  ];

  getHome() {
    return {
      featuredPodcasts: this.podcasts.slice(0, 2),
      latestEpisodes: this.podcasts.flatMap((podcast) => podcast.episodes).slice(0, 4),
      continueListening: this.podcasts.flatMap((podcast) => podcast.episodes).slice(0, 2),
      categories: Array.from(new Set(this.podcasts.map((podcast) => podcast.category))),
      channels: Array.from(new Set(this.podcasts.map((podcast) => podcast.channel))),
    };
  }

  getEpisodes() {
    return this.podcasts.flatMap((podcast) => podcast.episodes);
  }

  getChannels() {
    return Array.from(new Set(this.podcasts.map((podcast) => podcast.channel)));
  }

  getCategories() {
    return Array.from(new Set(this.podcasts.map((podcast) => podcast.category)));
  }
}
