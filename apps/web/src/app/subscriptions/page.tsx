import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { podcasts } from '../../lib/mvp-data';

async function SubscriptionsContent() {
  const subscriptions = podcasts.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscriptions"
        title="Your active subscriptions"
        description="Stay close to the creators and shows you care about most."
      />

      {subscriptions.length ? (
        <SectionCard title="Following" description="Your current subscribed shows.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((podcast) => (
              <div key={podcast.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{podcast.channel}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <EmptyState title="No subscriptions yet" description="Follow a few shows to build your feed." actionLabel="Explore shows" actionHref="/explore" />
      )}
    </div>
  );
}

export const metadata = {
  title: 'Subscriptions',
  description: 'Manage the podcasts you follow.',
};

export default function SubscriptionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading subscriptions…</div>}>
        <SubscriptionsContent />
      </Suspense>
    </AppShell>
  );
}
