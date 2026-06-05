'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { rs, daysLeft } from '@/lib/utils';

export default function Dashboard() {
  const { trips, parties, transactions, expenses, fleet, drivers, compliance, getPartyBalance } = useApp();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const revenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + t.billed, 0);
  const tripExp = trips.reduce((s, t) => s + t.total_exp, 0);
  const genExp = expenses.reduce((s, e) => s + e.amount, 0);
  const net = revenue - tripExp - genExp;
  const totalReceivable = parties.filter(p => p.type === 'client').reduce((s, p) => s + Math.max(0, getPartyBalance(p.id)), 0);
  const activeFleet = fleet.filter(f => f.status === 'Active').length;
  const activeDrivers = drivers.filter(d => d.status === 'Active').length;

  const recentTrips = [...trips].sort((a, b) => (b.load_date || '').localeCompare(a.load_date || '')).slice(0, 6);

  const alerts: { text: string; days: number }[] = [];
  compliance.forEach(c => {
    const dl = daysLeft(c.expiry);
    if (dl !== null && dl <= 60) alerts.push({ text: `${c.vehicle} — ${c.doc_type}`, days: dl });
  });
  drivers.forEach(d => {
    const dl = daysLeft(d.lic_exp);
    if (dl !== null && dl <= 60) alerts.push({ text: `${d.name} license`, days: dl });
  });
  alerts.sort((a, b) => a.days - b.days);

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
          <div className="metric-label">Receivable</div>
          <div className="metric-value gold">{rs(totalReceivable)}</div>
          <div className="metric-sub">from clients</div>
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
          <div className="section-label">Alerts</div>
          {alerts.length === 0 ? (
            <div className="empty" style={{ padding: '1rem' }}><div className="empty-icon" style={{ fontSize: 20 }}>✅</div>No urgent alerts</div>
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)' }}>
              {alerts.map((a, i) => {
                const badge = a.days < 0 ? 'badge-red' : a.days <= 14 ? 'badge-red' : a.days <= 30 ? 'badge-yellow' : 'badge-blue';
                const label = a.days < 0 ? 'Expired' : `${a.days}d left`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12.5 }}>
                    <span>{a.text}</span>
                    <span className={`badge ${badge}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
