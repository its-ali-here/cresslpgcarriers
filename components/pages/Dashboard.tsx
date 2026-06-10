'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { rs } from '@/lib/utils';

const PakistanMap = dynamic(() => import('@/components/PakistanMap'), { ssr: false });

export default function Dashboard() {
  const { trips, expenses, fleet, drivers } = useApp();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const revenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + t.billed, 0);
  const tripExp = trips.reduce((s, t) => s + t.total_exp, 0);
  const genExp = expenses.reduce((s, e) => s + e.amount, 0);
  const net = revenue - tripExp - genExp;
  const activeFleet = fleet.filter(f => f.status === 'Running in fleet').length;
  const activeDrivers = drivers.length;

  const recentTrips = [...trips].sort((a, b) => (b.load_date || '').localeCompare(a.load_date || '')).slice(0, 6);


  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">{dateStr}</div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total revenue</div>
          <div className="metric-value green">{rs(revenue)}</div>
          <div className="metric-sub">{trips.filter(t => t.status === 'Completed').length} completed trips</div>
        </div>
        <div className="metric">
          <div className="metric-label">Total expenses</div>
          <div className="metric-value red">{rs(tripExp + genExp)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Net profit</div>
          <div className={`metric-value ${net >= 0 ? 'green' : 'red'}`}>{rs(net)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Active fleet</div>
          <div className="metric-value">{activeFleet}</div>
          <div className="metric-sub">of {fleet.length} bowsers</div>
        </div>
        <div className="metric">
          <div className="metric-label">Active drivers</div>
          <div className="metric-value">{activeDrivers}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div>
          <div className="section-label">Recent trips</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Trip #</th><th>Vehicle</th><th>Route</th><th>Amount</th><th>Net P/L</th></tr>
              </thead>
              <tbody>
                {recentTrips.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty" style={{ padding: '1rem' }}>No trips yet</div></td></tr>
                ) : recentTrips.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{t.no || '—'}</td>
                    <td className="mono">{t.vehicle || '—'}</td>
                    <td style={{ fontSize: 11 }}>{t.from || ''}{t.from && t.to ? ' → ' : ''}{t.to || ''}</td>
                    <td className="mono">{rs(t.billed)}</td>
                    <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(t.net_pl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="section-label">Operations map</div>
          <div style={{ height: 360, borderRadius: 'var(--radius2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <PakistanMap />
          </div>
        </div>
      </div>
    </div>
  );
}
