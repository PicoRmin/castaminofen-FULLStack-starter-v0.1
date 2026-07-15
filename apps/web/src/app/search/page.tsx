'use client';

import { useMemo, useState } from 'react';

import { AppShell } from '../../components/app-shell';
import { EmptyState, PageHeader, SectionCard } from '@castaminofen/ui';
import { searchContent } from '../../lib/mvp-data';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchContent(query), [query]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Search"
          title={query ? `Results for “${query}”` : 'Search the library'}
          description="Find episodes, channels, and series by title or theme."
        />

        <label className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search podcasts, episodes, or channels"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        {!query ? (
          <SectionCard title="Start typing" description="Search across the entire catalog.">
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
              Try terms like “maker”, “technology”, or “northstar”.
            </div>
          </SectionCard>
        ) : null}

        {query && !results.podcasts.length && !results.episodes.length && !results.channels.length ? (
          <EmptyState title="No matches found" description="Try a different term or explore the featured catalog." actionLabel="Explore shows" actionHref="/explore" />
        ) : null}

        {results.podcasts.length ? (
          <SectionCard title="Podcasts" description="Series that match your search.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.podcasts.map((podcast) => (
                <div key={podcast.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{podcast.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{podcast.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {results.episodes.length ? (
          <SectionCard title="Episodes" description="Audio from matching series and topics.">
            <div className="space-y-3">
              {results.episodes.map((episode) => (
                <div key={episode.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{episode.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{episode.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {results.channels.length ? (
          <SectionCard title="Channels" description="Publishers that match the query.">
            <div className="flex flex-wrap gap-2">
              {results.channels.map((channel) => (
                <span key={channel} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">{channel}</span>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </AppShell>
  );
}
