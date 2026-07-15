import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { PageHeader, SectionCard } from '@castaminofen/ui';

async function ProfileContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Your listening identity"
        description="A simple overview of your account, preferences, and interests."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <SectionCard title="Account" description="Details that shape your experience.">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">Name: Maya Chen</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">Email: maya@example.com</div>
          </div>
        </SectionCard>

        <SectionCard title="Interests" description="Topics and communities you follow.">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Design</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Product</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">Culture</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Profile',
  description: 'See your account information and listening interests.',
};

export default function ProfilePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading profile…</div>}>
        <ProfileContent />
      </Suspense>
    </AppShell>
  );
}
