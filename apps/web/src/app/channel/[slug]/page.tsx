import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AppShell } from '../../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts, channels } from '../../../lib/mvp-data';

async function ChannelDetail({ slug }: { slug: string }) {
  const normalized = decodeURIComponent(slug).replace(/-/g, ' ');
  const matches = podcasts.filter((podcast) => podcast.channel.toLowerCase() === normalized.toLowerCase());

  if (!matches.length) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Channel"
        title={matches[0]?.channel ?? 'Channel'}
        description={`Shows and episodes from ${matches[0]?.channel ?? 'this creator'}.`}
      />

      <SectionCard title="Featured shows" description="A selection of current releases.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((podcast) => (
            <Link key={podcast.id} href={`/podcast/${podcast.slug}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="mb-4 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-sky-600" />
              <p className="font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{podcast.description}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      {matches[0] ? (
        <SectionCard title="Latest episodes" description="Fresh releases from this channel.">
          <div className="space-y-3">
            {matches.flatMap((podcast) => podcast.episodes).slice(0, 4).map((episode) => (
              <Link key={episode.id} href={`/episode/${episode.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{episode.description}</p>
                </div>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{episode.duration}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="No episodes available" description="This channel is still publishing new content." />
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = decodeURIComponent(slug).replace(/-/g, ' ');
  const channel = channels.find((item) => item.toLowerCase() === normalized.toLowerCase());

  return {
    title: channel ? `${channel} | Castaminofen` : 'Channel',
    description: channel ? `Explore audio from ${channel}` : 'Channel details',
  };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading channel…</div>}>
        <ChannelDetail slug={slug} />
      </Suspense>
    </AppShell>
  );
}
