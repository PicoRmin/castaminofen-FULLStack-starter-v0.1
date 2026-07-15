import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts } from '../../lib/mvp-data';

async function PlayerContent() {
  const featured = podcasts[0];
  const episode = featured?.episodes[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Player"
        title="Now playing"
        description="A compact audio experience built for focus and quick access."
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Current episode" description="Premium playback controls and context.">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{episode?.title ?? 'Episode title'}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{featured?.title ?? 'Podcast title'}</p>
            <div className="mt-4 h-32 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600" />
          </div>
        </SectionCard>

        <SectionCard title="Playback controls" description="Responsive, accessible controls.">
          <div className="space-y-4">
            <audio controls className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <source src={episode?.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Queue</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Share</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Sleep timer</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Player',
  description: 'Play and manage your current audio track.',
};

export default function PlayerPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading player…</div>}>
        <PlayerContent />
      </Suspense>
    </AppShell>
  );
}
