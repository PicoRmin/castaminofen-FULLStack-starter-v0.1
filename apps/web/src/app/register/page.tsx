import Link from 'next/link';
import { Suspense } from 'react';

import { AppShell } from '../../components/app-shell';
import { PageHeader } from '@castaminofen/ui';

function RegisterForm() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <PageHeader
        eyebrow="Join today"
        title="Create your account"
        description="Save your listening history and get the best of the catalog in one place."
      />
      <form className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Name
          <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Your name" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
          <input type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" placeholder="you@example.com" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
          <input type="password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" placeholder="••••••••" />
        </label>
        <button type="submit" className="rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
          Create account
        </button>
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Already have an account? <Link href="/login" className="font-semibold text-sky-600">Log in</Link>
      </p>
    </div>
  );
}

export const metadata = {
  title: 'Register',
  description: 'Create a new Castaminofen account.',
};

export default function RegisterPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading sign-up…</div>}>
        <RegisterForm />
      </Suspense>
    </AppShell>
  );
}
