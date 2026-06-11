
export default function ProgressPage() {
  return (
    <div className="p-8 neu-page min-h-screen">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '8px' }}>My Progress</h1>
      <div className="neu-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '22px' }}>📈</span>
        <p style={{ color: 'var(--neu-text-muted)', fontSize: '14px' }}>Progress tracking — coming in Step 22.</p>
      </div>
    </div>
  );
}
