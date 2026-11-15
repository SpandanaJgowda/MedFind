import React from 'react';

export default function SimpleDonutChart({ segments = [] }) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
        No metric records recorded
      </div>
    );
  }

  // Calculate cumulative percentages for conical gradient
  let cumulative = 0;
  const gradientParts = segments.map((seg) => {
    const start = cumulative;
    const pct = ((Number(seg.value) || 0) / total) * 100;
    cumulative += pct;
    return `${seg.color} ${start}% ${cumulative}%`;
  });

  const backgroundGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', padding: '10px 0' }}>
      <div
        style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: backgroundGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
            {total}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((s, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color }}></span>
            <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{s.label}:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              ({Math.round(((Number(s.value) || 0) / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
