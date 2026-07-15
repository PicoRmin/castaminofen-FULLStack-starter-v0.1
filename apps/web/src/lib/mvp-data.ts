export type Episode = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  audioUrl: string;
  publishedAt: string;
  podcastSlug: string;
};

export type Podcast = {
  id: string;
  slug: string;
  title: string;
  channel: string;
  description: string;
  category: string;
  image: string;
  accent: string;
  episodes: Episode[];
};

export const podcasts: Podcast[] = [
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

export const channels = Array.from(new Set(podcasts.map((podcast) => podcast.channel)));
export const categories = Array.from(new Set(podcasts.map((podcast) => podcast.category)));

export function getPodcastBySlug(slug: string) {
  return podcasts.find((podcast) => podcast.slug === slug);
}

export function getEpisodeBySlug(slug: string) {
  return podcasts.flatMap((podcast) => podcast.episodes).find((episode) => episode.slug === slug);
}

export function searchContent(term: string) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return { podcasts, episodes: podcasts.flatMap((podcast) => podcast.episodes), channels };
  }

  return {
    podcasts: podcasts.filter((podcast) => {
      const haystack =
        `${podcast.title} ${podcast.description} ${podcast.channel} ${podcast.category}`.toLowerCase();
      return haystack.includes(normalized);
    }),
    episodes: podcasts
      .flatMap((podcast) => podcast.episodes)
      .filter((episode) => {
        const haystack =
          `${episode.title} ${episode.description} ${episode.podcastSlug}`.toLowerCase();
        return haystack.includes(normalized);
      }),
    channels: channels.filter((channel) => channel.toLowerCase().includes(normalized)),
  };
}

export function getHomeData() {
  const latestEpisodes = podcasts.flatMap((podcast) => podcast.episodes).slice(0, 4);
  return {
    featuredPodcasts: podcasts.slice(0, 2),
    latestEpisodes,
    continueListening: latestEpisodes.slice(0, 2),
    categories,
    channels,
  };
}
