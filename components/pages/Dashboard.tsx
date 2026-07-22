'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { computeFleetPerformance, getBestPerformers, getWorstPerformers, getHighestRisk, fleetAvgRiskShare } from '@/lib/fleetPerformance';
import BarRanking from '@/components/charts/BarRanking';

const PakistanMap = dynamic(() => import('@/components/PakistanMap'), { ssr: false });

export default function Dashboard() {
  const { trips, settings } = useApp();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const fleetPerf = useMemo(() => computeFleetPerformance(trips, settings.dieselBench), [trips, settings.dieselBench]);
  const worstPerformers = getWorstPerformers(fleetPerf);
  const bestPerformer = getBestPerformers(fleetPerf, 1)[0];
  const worstPerformer = worstPerformers[0];
  const highestRisk = getHighestRisk(fleetPerf, 1)[0];
  const avgRiskShare = fleetAvgRiskShare(fleetPerf);

  return (
    <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">{dateStr}</div>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="empty">No trips yet — fleet performance will appear here once trips are logged.</div>
      ) : worstPerformers.length === 0 ? (
        <div className="empty">Not enough trip data yet to rank fleet performance.</div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem' }}>
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="metrics" style={{ flexShrink: 0, marginBottom: '0.85rem' }}>
              {bestPerformer && (
                <div className="metric">
                  <div className="metric-label">Best performer</div>
                  <div className="metric-value green">{bestPerformer.vehicle}</div>
                  <div className="metric-sub">Score {Math.round(bestPerformer.compositeScore ?? 0)}/100</div>
                </div>
              )}
              {worstPerformer && (
                <div className="metric">
                  <div className="metric-label">Worst performer</div>
                  <div className="metric-value red">{worstPerformer.vehicle}</div>
                  <div className="metric-sub">Score {Math.round(worstPerformer.compositeScore ?? 0)}/100</div>
                </div>
              )}
              {highestRisk && highestRisk.riskShare !== null && (
                <div className="metric">
                  <div className="metric-label">Highest expense-risk</div>
                  <div className="metric-value gold">{highestRisk.vehicle}</div>
                  <div className="metric-sub">
                    {Math.round(highestRisk.riskShare * 100)}% of cost is chalans/tyre-bills/etc.
                    {avgRiskShare !== null ? ` (fleet avg ${Math.round(avgRiskShare * 100)}%)` : ''}
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="section-label" style={{ margin: '0 0 0.6rem', flexShrink: 0 }}>Composite score (worst first)</div>
                <BarRanking
                  items={worstPerformers.map(p => ({ label: p.vehicle, value: Math.round(p.compositeScore ?? 0) }))}
                />
              </div>
              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="section-label" style={{ margin: '0 0 0.6rem', flexShrink: 0 }}>Underperforming vehicles</div>
                <div className="table-wrap" style={{ overflow: 'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Vehicle</th><th>Score</th><th>km/ltr</th><th>Days vs peers</th><th>Risk %</th></tr>
                    </thead>
                    <tbody>
                      {worstPerformers.map(p => (
                        <tr key={p.vehicle}>
                          <td className="mono">{p.vehicle}</td>
                          <td className="mono">{Math.round(p.compositeScore ?? 0)}</td>
                          <td className="mono">{p.avgKmLtr !== null ? p.avgKmLtr.toFixed(2) : '—'}</td>
                          <td className="mono" style={{ color: p.overrunRatio !== null && p.overrunRatio > 1 ? 'var(--red)' : undefined }}>
                            {p.overrunRatio !== null ? `${p.overrunRatio > 1 ? '+' : ''}${Math.round((p.overrunRatio - 1) * 100)}%` : '—'}
                          </td>
                          <td className="mono" style={{ color: p.riskShare !== null && avgRiskShare !== null && p.riskShare > avgRiskShare * 1.3 ? 'var(--accent2)' : undefined }}>
                            {p.riskShare !== null ? `${Math.round(p.riskShare * 100)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="section-label" style={{ flexShrink: 0 }}>Operations map</div>
            <div style={{ flex: 1, minHeight: 0, borderRadius: 'var(--radius2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <PakistanMap />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
