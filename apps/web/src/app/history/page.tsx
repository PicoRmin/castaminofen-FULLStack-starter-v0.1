import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts } from '../../lib/mvp-data';

async function HistoryContent() {
  const history = podcasts.flatMap((podcast) => podcast.episodes).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Recently played"
        description="A quick look at the audio you have engaged with most recently."
      />

      {history.length ? (
        <SectionCard title="Recent listening" description="A lightweight timeline of recent episodes.">
          <div className="space-y-3">
            {history.map((episode) => (
              <div key={episode.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{episode.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="No history yet" description="Start listening to build your timeline." actionLabel="Browse episodes" actionHref="/explore" />
      )}
    </div>
  );
}

export const metadata = {
  title: 'History',
  description: 'Your recent listening history.',
};

export default function HistoryPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading history…</div>}>
        <HistoryContent />
      </Suspense>
    </AppShell>
  );
}
