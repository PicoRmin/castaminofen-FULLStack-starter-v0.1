export default function DashboardPage() {
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
          maxWidth: 860,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Creator dashboard</h1>
        <p style={{ color: '#64748b' }}>
          This is a placeholder for future publishing workflows, but the MVP is already usable for
          listening and discovery.
        </p>
      </div>
    </main>
  );
}
