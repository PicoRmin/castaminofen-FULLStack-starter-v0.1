import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts } from '../../lib/mvp-data';

async function LibraryContent() {
  const saved = podcasts.slice(0, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Your saved picks"
        description="Keep the shows you want to come back to in one place."
      />

      {saved.length ? (
        <SectionCard title="Saved podcasts" description="A personal collection of shows to revisit.">
          <div className="grid gap-4 md:grid-cols-2">
            {saved.map((podcast) => (
              <div key={podcast.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{podcast.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="No saved content yet" description="Start following a few shows and they will appear here." actionLabel="Explore shows" actionHref="/explore" />
      )}
    </div>
  );
}

export const metadata = {
  title: 'Library',
  description: 'Your saved podcasts and episodes.',
};

export default function LibraryPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading library…</div>}>
        <LibraryContent />
      </Suspense>
    </AppShell>
  );
}
