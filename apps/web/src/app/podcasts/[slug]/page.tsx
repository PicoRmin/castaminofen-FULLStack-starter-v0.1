import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPodcastBySlug } from '../../../lib/mvp-data';

export default function PodcastDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <PodcastDetailContent params={params} />;
}

async function PodcastDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const podcast = getPodcastBySlug(slug);

  if (!podcast) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        padding: '32px 20px 80px',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
        }}
      >
        <Link href="/podcasts" style={{ color: '#2563eb', fontWeight: 600 }}>
          ← Back to podcasts
        </Link>
        <h1 style={{ marginBottom: 8 }}>{podcast.title}</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          {podcast.channel} · {podcast.category}
        </p>
        <p style={{ lineHeight: 1.7 }}>{podcast.description}</p>
        <h3>Episodes</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {podcast.episodes.map((episode: (typeof podcast.episodes)[number]) => (
            <div
              key={episode.id}
              style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 14 }}
            >
              <strong>{episode.title}</strong>
              <div style={{ color: '#64748b', marginTop: 4 }}>
                {episode.duration} · {episode.publishedAt}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
