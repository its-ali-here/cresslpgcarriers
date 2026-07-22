export interface BarRankingItem {
  label: string;
  value: number;
  sublabel?: string;
}

interface BarRankingProps {
  items: BarRankingItem[];
  max?: number;
  colorFor?: (item: BarRankingItem, index: number) => string;
  height?: number;
}

function defaultColorFor(item: BarRankingItem): string {
  if (item.value < 40) return 'var(--red)';
  if (item.value < 70) return 'var(--accent2)';
  return 'var(--green)';
}

export default function BarRanking({ items, max, colorFor = defaultColorFor, height = 22 }: BarRankingProps) {
  const scaleMax = max ?? Math.max(100, ...items.map(i => i.value));

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => {
          const pct = scaleMax > 0 ? Math.max(2, Math.min(100, (item.value / scaleMax) * 100)) : 0;
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="mono" style={{ width: 76, flexShrink: 0, fontSize: 11.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
              <div style={{ flex: 1, height, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: colorFor(item, i), borderRadius: 4 }} />
              </div>
              <div className="mono" style={{ width: 44, flexShrink: 0, fontSize: 12, textAlign: 'right', color: 'var(--text2)' }}>
                {item.sublabel ?? Math.round(item.value)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 10.5, color: 'var(--text3)' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--red)', marginRight: 5 }} />Needs attention (&lt;40)</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--accent2)', marginRight: 5 }} />Average (40–69)</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--green)', marginRight: 5 }} />Good (70+)</span>
      </div>
    </div>
  );
}
