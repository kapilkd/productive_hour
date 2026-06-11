import type { Frame, ContentBlocks } from '../../types';

interface Props {
  frame: Frame;
  frameNumber: number;
  total: number;
}

export default function FrameRenderer({ frame, frameNumber, total }: Props) {
  const cb: ContentBlocks = frame.contentBlocks ?? {};
  const layout = frame.layoutType ?? 'concept';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--neu-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Frame {frameNumber} of {total}
        </span>
        <span className="neu-badge" style={{ fontSize: '10px' }}>
          {layout.replace('_', ' ')}
        </span>
      </div>

      {/* Slide card */}
      <div className="neu-slide" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {layout === 'title'        && <TitleLayout title={frame.frameTitle ?? frame.contentText} cb={cb} />}
        {layout === 'concept'      && <ConceptLayout title={frame.frameTitle} cb={cb} contentText={frame.contentText} />}
        {layout === 'definition'   && <DefinitionLayout title={frame.frameTitle} cb={cb} />}
        {layout === 'image_focus'  && <ImageFocusLayout title={frame.frameTitle} frame={frame} cb={cb} />}
        {layout === 'split'        && <SplitLayout title={frame.frameTitle} cb={cb} />}
        {layout === 'table_layout' && <TableLayout title={frame.frameTitle} cb={cb} />}
        {layout === 'quote'        && <QuoteLayout cb={cb} />}
        {layout === 'summary'      && <SummaryLayout title={frame.frameTitle} cb={cb} />}
      </div>
    </div>
  );
}

// ── Title ─────────────────────────────────────────────────────────────────────

function TitleLayout({ title, cb }: { title: string; cb: ContentBlocks }) {
  const accentColors: Record<string, string> = {
    tech: '#818cf8', science: '#4ade80', history: '#fb923c',
    math: '#60a5fa', general: '#818cf8',
  };
  const accent = accentColors[cb.backgroundHint ?? 'general'] ?? '#818cf8';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem' }}>
      <div style={{ width: '48px', height: '4px', borderRadius: '2px', background: accent, marginBottom: '28px',
        boxShadow: `0 0 12px ${accent}` }} />
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neu-text)', lineHeight: 1.25, marginBottom: '14px' }}>
        {title}
      </h1>
      {cb.subtitle && (
        <p style={{ fontSize: '1rem', color: 'var(--neu-text-muted)', maxWidth: '380px', lineHeight: 1.6 }}>
          {cb.subtitle}
        </p>
      )}
      <div style={{ width: '48px', height: '4px', borderRadius: '2px', background: accent, marginTop: '28px',
        boxShadow: `0 0 12px ${accent}` }} />
    </div>
  );
}

// ── Concept ───────────────────────────────────────────────────────────────────

function ConceptLayout({ title, cb, contentText }: { title?: string; cb: ContentBlocks; contentText: string }) {
  const bullets = cb.bullets ?? [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
      {title && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ width: '28px', height: '3px', background: 'var(--neu-accent)', borderRadius: '2px', marginBottom: '10px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neu-text)' }}>{title}</h2>
        </div>
      )}
      {bullets.length > 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bullets.map((b, i) => (
            <div key={i} className="neu-bullet-item">
              <span style={{ marginTop: '1px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--neu-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: '11px', fontWeight: 700, color: 'var(--neu-accent-text)' }}>
                {i + 1}
              </span>
              <p style={{ fontSize: '13px', color: 'var(--neu-text)', lineHeight: 1.55 }}>{b}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '14px', color: 'var(--neu-text)', lineHeight: 1.7, flex: 1 }}>{contentText}</p>
      )}
      {cb.highlight && (
        <div className="neu-highlight-box" style={{ marginTop: '14px' }}>
          <p style={{ fontSize: '12px', color: 'var(--neu-accent)', fontWeight: 500 }}>{cb.highlight}</p>
        </div>
      )}
    </div>
  );
}

// ── Definition ────────────────────────────────────────────────────────────────

function DefinitionLayout({ title, cb }: { title?: string; cb: ContentBlocks }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="neu-btn neu-btn-accent" style={{ fontSize: '15px', fontWeight: 700, pointerEvents: 'none' }}>
          {cb.term ?? title ?? 'Definition'}
        </button>
      </div>
      {cb.definition && (
        <p style={{ fontSize: '14px', color: 'var(--neu-text)', lineHeight: 1.7, marginBottom: '1.25rem', flex: 1 }}>
          {cb.definition}
        </p>
      )}
      {(cb.examples ?? []).length > 0 && (
        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--neu-text-muted)', marginBottom: '10px', fontWeight: 600 }}>
            Examples
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(cb.examples ?? []).map((ex, i) => (
              <span key={i} className="neu-flat" style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--neu-text)' }}>
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image Focus ───────────────────────────────────────────────────────────────

function ImageFocusLayout({ title, frame, cb }: { title?: string; frame: Frame; cb: ContentBlocks }) {
  const imgUrl = frame.imageUrl ?? (frame.extractedImages?.[0]?.url);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '160px', overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={cb.caption ?? title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--neu-shadow-dark)' }}>
            <span style={{ fontSize: '32px' }}>🖼️</span>
          </div>
        )}
      </div>
      <div style={{ padding: '1.25rem', flex: 1 }}>
        {title && <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '6px' }}>{title}</h2>}
        {cb.caption && <p style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 600, marginBottom: '8px' }}>{cb.caption}</p>}
        {cb.description && <p style={{ fontSize: '13px', color: 'var(--neu-text-muted)', lineHeight: 1.6 }}>{cb.description}</p>}
      </div>
    </div>
  );
}

// ── Split ─────────────────────────────────────────────────────────────────────

function SplitLayout({ title, cb }: { title?: string; cb: ContentBlocks }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
      {title && <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '1rem' }}>{title}</h2>}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="neu-inset" style={{ borderRadius: '14px', padding: '1rem' }}>
          <p style={{ fontSize: '13px', color: 'var(--neu-text)', lineHeight: 1.65 }}>{cb.leftContent}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(cb.rightBullets ?? []).map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--neu-accent)', marginTop: '1px', flexShrink: 0, fontWeight: 700 }}>▸</span>
              <p style={{ fontSize: '12px', color: 'var(--neu-text)', lineHeight: 1.55 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function TableLayout({ title, cb }: { title?: string; cb: ContentBlocks }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
      {title && <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neu-text)', marginBottom: '1rem' }}>{title}</h2>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="neu-table">
          {(cb.headers ?? []).length > 0 && (
            <thead>
              <tr>
                {(cb.headers ?? []).map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {(cb.rows ?? []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quote ─────────────────────────────────────────────────────────────────────

function QuoteLayout({ cb }: { cb: ContentBlocks }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem' }}>
      <span style={{ fontSize: '64px', lineHeight: 1, color: 'var(--neu-accent)', opacity: 0.3, marginBottom: '8px', fontFamily: 'Georgia, serif' }}>"</span>
      <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--neu-text)', lineHeight: 1.7, maxWidth: '400px', marginBottom: '20px' }}>
        {cb.quote}
      </p>
      {cb.attribution && (
        <p style={{ fontSize: '12px', color: 'var(--neu-accent)', fontWeight: 600 }}>— {cb.attribution}</p>
      )}
    </div>
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

function SummaryLayout({ title, cb }: { title?: string; cb: ContentBlocks }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--neu-success)' }}>
          Key Takeaways
        </span>
        {title && <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neu-text)', marginTop: '4px' }}>{title}</h2>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(cb.takeaways ?? []).map((t, i) => (
          <div key={i} className="neu-bullet-item" style={{ borderLeft: '3px solid var(--neu-success)' }}>
            <span style={{ color: 'var(--neu-success)', fontWeight: 700, flexShrink: 0, fontSize: '14px' }}>✓</span>
            <p style={{ fontSize: '13px', color: 'var(--neu-text)', lineHeight: 1.55 }}>{t}</p>
          </div>
        ))}
      </div>
      {cb.callToAction && (
        <div className="neu-inset" style={{ marginTop: '14px', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--neu-accent)', fontWeight: 500 }}>{cb.callToAction}</p>
        </div>
      )}
    </div>
  );
}
