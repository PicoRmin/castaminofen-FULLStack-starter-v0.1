import { podcasts } from '../../lib/mvp-data';

export default function EpisodesPage() {
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
        <h1 style={{ marginBottom: 8 }}>Episodes</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>Stream the latest imported episode cards.</p>
        <div style={{ display: 'grid', gap: 16 }}>
          {podcasts
			.flatMap((podcast: (typeof podcasts)[number]) => podcast.episodes)
			.map((episode: (typeof podcasts)[number]['episodes'][number]) => (
				<article
					key={episode.id}
					style={{
						background: '#fff',
						borderRadius: 18,
						padding: 18,
						boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
					}}
				>
                <h3 style={{ marginTop: 0 }}>{episode.title}</h3>
                <p style={{ color: '#475569', lineHeight: 1.55 }}>{episode.description}</p>
                <div style={{ color: '#64748b' }}>
                  {episode.duration} · {episode.publishedAt}
                </div>
              </article>
            ))}
        </div>
      </div>
    </main>
  );
}
