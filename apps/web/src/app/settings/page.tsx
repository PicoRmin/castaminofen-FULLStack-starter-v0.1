import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { PageHeader, SectionCard } from '@castaminofen/ui';

async function SettingsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Personalize your experience"
        description="Tune notification preferences, playback, and accessibility options."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Playback" description="Preferred listening options.">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">Autoplay on</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">Playback speed: 1x</div>
          </div>
        </SectionCard>

        <SectionCard title="Accessibility" description="Adjust how content is presented.">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">High contrast mode</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">Captions available</div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Settings',
  description: 'Manage playback and accessibility settings.',
};

export default function SettingsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading settings…</div>}>
        <SettingsContent />
      </Suspense>
    </AppShell>
  );
}
