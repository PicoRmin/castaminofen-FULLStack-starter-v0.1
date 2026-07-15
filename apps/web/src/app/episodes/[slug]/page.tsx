import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEpisodeBySlug } from '../../../lib/mvp-data';

export default function EpisodeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <EpisodeDetailContent params={params} />;
}

async function EpisodeDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);

  if (!episode) {
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
        <Link href="/episodes" style={{ color: '#2563eb', fontWeight: 600 }}>
          ← Back to episodes
        </Link>
        <h1 style={{ marginBottom: 8 }}>{episode.title}</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          {episode.duration} · {episode.publishedAt}
        </p>
        <p style={{ lineHeight: 1.7 }}>{episode.description}</p>
        <audio controls style={{ width: '100%', marginTop: 12 }}>
          <source src={episode.audioUrl} type="audio/mpeg" />
        </audio>
      </div>
    </main>
  );
}
