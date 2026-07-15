import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AppShell } from '../../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { getEpisodeBySlug, getPodcastBySlug } from '../../../lib/mvp-data';

async function EpisodeDetail({ slug }: { slug: string }) {
  const episode = getEpisodeBySlug(slug);

  if (!episode) {
    notFound();
  }

  const podcast = getPodcastBySlug(episode.podcastSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Episode"
        title={episode.title}
        description={episode.description}
        actions={
          <Link href="/player" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
            Play now
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Show" description={podcast?.channel ?? 'Featured creator'}>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{podcast?.title ?? 'Related show'}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{podcast?.description ?? 'A thoughtful show with rich storytelling.'}</p>
          </div>
        </SectionCard>

        <SectionCard title="Listen" description="Everything needed to get started.">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{episode.duration} • {episode.publishedAt}</p>
                </div>
                <Link href="/player" className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950">
                  Open player
                </Link>
              </div>
            </div>
            <audio controls className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <source src={episode.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </SectionCard>
      </div>

      {!podcast ? <EmptyState title="No related show found" description="This episode is still being indexed." /> : null}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);

  return {
    title: episode ? `${episode.title} | Castaminofen` : 'Episode',
    description: episode?.description ?? 'Episode details',
  };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading episode…</div>}>
        <EpisodeDetail slug={slug} />
      </Suspense>
    </AppShell>
  );
}
