import Link from 'next/link';
import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts, categories, channels } from '../../lib/mvp-data';

function ExploreContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discovery"
        title="Explore the catalog"
        description="Browse by category, channel, and season to uncover your next favorite series."
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Browse by category" description="Jump into your next listening lane.">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">{category}</span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Featured channels" description="Creators and stations to follow.">
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => (
              <div key={channel} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{channel}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">A steady stream of thoughtful conversations and stories.</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Today’s lineup" description="A product-minded collection for your commute and downtime.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {podcasts.map((podcast) => (
            <Link key={podcast.id} href={`/podcast/${podcast.slug}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="mb-4 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-sky-600" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{podcast.description}</p>
              <p className="mt-3 text-sm font-medium text-sky-600">{podcast.episodes.length} episodes</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      {!podcasts.length ? <EmptyState title="No matches yet" description="Try a broader search to surface more shows." /> : null}
    </div>
  );
}

export const metadata = {
  title: 'Explore podcasts',
  description: 'Browse podcasts by category, channel, and featured series.',
};

export default function ExplorePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading catalog…</div>}>
        <ExploreContent />
      </Suspense>
    </AppShell>
  );
}
