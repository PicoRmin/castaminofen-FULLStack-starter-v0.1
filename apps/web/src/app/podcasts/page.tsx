import Link from 'next/link';
import { podcasts } from '../../lib/mvp-data';

export default function PodcastsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        padding: '32px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 8 }}>Podcasts</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Browse imported shows from the MVP catalog.
        </p>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {podcasts.map((podcast: (typeof podcasts)[number]) => (
            <article
              key={podcast.id}
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: 18,
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{podcast.title}</h3>
              <p style={{ color: '#475569', lineHeight: 1.55 }}>{podcast.description}</p>
              <div style={{ color: '#64748b', marginBottom: 10 }}>
                {podcast.channel} · {podcast.category}
              </div>
              <Link
                href={`/podcasts/${podcast.slug}`}
                style={{ color: '#2563eb', fontWeight: 600 }}
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
