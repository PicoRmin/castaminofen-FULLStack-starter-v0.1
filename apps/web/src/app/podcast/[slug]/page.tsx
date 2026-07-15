import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AppShell } from '../../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { getPodcastBySlug } from '../../../lib/mvp-data';

async function PodcastDetail({ slug }: { slug: string }) {
  const podcast = getPodcastBySlug(slug);

  if (!podcast) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Podcast"
        title={podcast.title}
        description={podcast.description}
        actions={
          <Link href="/subscriptions" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
            Subscribe
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="About" description={`${podcast.channel} • ${podcast.category}`}>
          <div className="rounded-3xl bg-gradient-to-br from-slate-700 to-sky-600 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.3em] opacity-80">Featured</p>
            <h2 className="mt-3 text-2xl font-semibold">{podcast.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-100">{podcast.description}</p>
          </div>
        </SectionCard>

        <SectionCard title="Episodes" description="The latest episodes in this series.">
          {podcast.episodes.length ? (
            <div className="space-y-3">
              {podcast.episodes.map((episode) => (
                <Link key={episode.id} href={`/episode/${episode.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{episode.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{episode.duration}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No episodes yet" description="This show is still being prepared." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const podcast = getPodcastBySlug(slug);

  return {
    title: podcast ? `${podcast.title} | Castaminofen` : 'Podcast',
    description: podcast?.description ?? 'Podcast details',
  };
}

export default async function PodcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading podcast…</div>}>
        <PodcastDetail slug={slug} />
      </Suspense>
    </AppShell>
  );
}
