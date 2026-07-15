import { channels } from '../../lib/mvp-data';

export default function ChannelPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        padding: '32px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 8 }}>Channels</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Browse the creative networks behind the imported podcasts.
        </p>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {channels.map((channel: string) => (
            <article
              key={channel}
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: 18,
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{channel}</h3>
              <p style={{ color: '#475569', lineHeight: 1.55 }}>
                A network of curated podcasts available in the MVP experience.
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
