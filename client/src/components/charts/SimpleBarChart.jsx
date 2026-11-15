import React from 'react';

export default function SimpleBarChart({ data = [], labelKey = 'label', valueKey = 'value', height = 200, color = 'var(--color-primary)' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
        No activity data available yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
        {data.map((item, idx) => {
          const val = Number(item[valueKey]) || 0;
          const pct = Math.max((val / maxValue) * 100, 4);
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                {val}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${pct}%`,
                  backgroundColor: color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.4s ease, background-color 0.2s',
                  boxShadow: '0 2px 6px rgba(15, 118, 110, 0.15)'
                }}
                title={`${item[labelKey]}: ${val}`}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item[labelKey]}>
            {item[labelKey]}
          </div>
        ))}
      </div>
    </div>
  );
}
