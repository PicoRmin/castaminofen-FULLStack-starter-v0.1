import Link from 'next/link';
import { Suspense } from 'react';

import { AppShell } from '../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { getHomeData } from '../lib/mvp-data';

function FeaturedSection() {
  const { featuredPodcasts, latestEpisodes, continueListening, categories, channels } = getHomeData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fresh for today"
        title="Discover thoughtful audio that fits your day"
        description="Move from trending shows to hand-picked episodes and keep listening across devices."
        actions={
          <>
            <Link href="/explore" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
              Explore now
            </Link>
            <Link href="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100">
              Sign in
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard title="Featured series" description="A curated selection of top shows this week.">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredPodcasts.map((podcast) => (
              <Link key={podcast.id} href={`/podcast/${podcast.slug}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="mb-3 h-24 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{podcast.description}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Continue listening" description="Pick up where you left off.">
          {continueListening.length ? (
            <div className="space-y-3">
              {continueListening.map((episode) => (
                <div key={episode.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{episode.duration} • {episode.podcastSlug}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing in progress" description="Resume an episode and it will appear here." />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Latest episodes" description="Fresh stories and conversations released recently.">
          <div className="space-y-4">
            {latestEpisodes.map((episode) => (
              <Link key={episode.id} href={`/episode/${episode.slug}`} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{episode.duration}</span>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{episode.description}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard title="Categories" description="Find new spaces to explore.">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">{category}</span>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Channels" description="Follow the publishers shaping the feed.">
            <div className="space-y-2">
              {channels.map((channel) => (
                <div key={channel} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">{channel}</div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Castaminofen | Discover podcasts',
  description: 'A polished, mobile-first podcast experience with search, subscriptions, and playback.',
};

export default function HomePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading home experience…</div>}>
        <FeaturedSection />
      </Suspense>
    </AppShell>
  );
}
