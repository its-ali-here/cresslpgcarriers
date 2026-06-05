'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { rs } from '@/lib/utils';

type ReportTab = 'pl' | 'trips-report' | 'receivables' | 'payables' | 'diesel';

export default function Reports() {
  const [tab, setTab] = useState<ReportTab>('pl');
  const { trips, parties, expenses, drivers, settings, getPartyBalance } = useApp();

  return (
    <div className="page">
      <div className="page-header"><div className="page-title">Reports</div></div>

      <div className="tabs">
        {([['pl', 'P&L Summary'], ['trips-report', 'Trip costing'], ['receivables', 'Receivables'], ['payables', 'Payables'], ['diesel', 'Diesel analysis']] as [ReportTab, string][]).map(([id, label]) => (
          <div key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      {tab === 'pl' && <PLReport trips={trips} expenses={expenses} />}
      {tab === 'trips-report' && <TripCostingReport trips={trips} drivers={drivers} />}
      {tab === 'receivables' && <ReceivablesReport parties={parties} getPartyBalance={getPartyBalance} />}
      {tab === 'payables' && <PayablesReport parties={parties} getPartyBalance={getPartyBalance} />}
      {tab === 'diesel' && <DieselReport trips={trips} dieselBench={settings.dieselBench} />}
    </div>
  );
}

function PLReport({ trips, expenses }: { trips: ReturnType<typeof useApp>['trips']; expenses: ReturnType<typeof useApp>['expenses'] }) {
  const revenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + t.billed, 0);
  const tripExp = trips.reduce((s, t) => s + t.total_exp, 0);
  const genExp = expenses.reduce((s, e) => s + e.amount, 0);
  const net = revenue - tripExp - genExp;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <div className="metric"><div className="metric-label">Total revenue</div><div className="metric-value green">{rs(revenue)}</div><div className="metric-sub">from completed trips</div></div>
        <div className="metric"><div className="metric-label">Trip expenses</div><div className="metric-value red">{rs(tripExp)}</div></div>
        <div className="metric"><div className="metric-label">General expenses</div><div className="metric-value red">{rs(genExp)}</div></div>
        <div className="metric"><div className="metric-label">Net profit</div><div className={`metric-value ${net >= 0 ? 'green' : 'red'}`}>{rs(net)}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Trip #</th><th>Date</th><th>Vehicle</th><th>Route</th><th>Billed</th><th>Expenses</th><th>Net P/L</th><th>Cost/ton</th></tr></thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id}>
                <td className="mono">{t.no || '—'}</td>
                <td>{t.load_date}</td>
                <td className="mono">{t.vehicle}</td>
                <td style={{ fontSize: 11 }}>{t.from}→{t.to}</td>
                <td className="mono">{rs(t.billed)}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{rs(t.total_exp)}</td>
                <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(t.net_pl)}</td>
                <td className="mono">{t.lifted > 0 ? 'Rs ' + (t.total_exp / t.lifted * 1000).toFixed(0) + '/ton' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TripCostingReport({ trips, drivers }: { trips: ReturnType<typeof useApp>['trips']; drivers: ReturnType<typeof useApp>['drivers'] }) {
  if (!trips.length) return <div className="empty"><div className="empty-icon">📊</div>No trips logged yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>LPG lifted</th><th>LPG delivered</th><th>Gain/loss</th><th>Days</th><th>Over days</th><th>Delay reason</th><th>Total exp</th><th>Net P/L</th></tr></thead>
        <tbody>
          {trips.map(t => {
            const drv = drivers.find(d => d.id === t.driver);
            const diff = parseFloat(t.lpg_diff);
            return (
              <tr key={t.id}>
                <td className="mono">{t.no || '—'}</td>
                <td className="mono">{t.vehicle}</td>
                <td>{drv ? drv.name : '—'}</td>
                <td style={{ fontSize: 11 }}>{t.from}→{t.to}</td>
                <td className="mono">{t.lifted ? t.lifted.toLocaleString() : ''}</td>
                <td className="mono">{t.delivered ? t.delivered.toLocaleString() : ''}</td>
                <td className="mono" style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text)' }}>{t.lpg_diff || '0'}</td>
                <td className="mono">{t.act_days || '—'}</td>
                <td className="mono" style={{ color: t.over_days > 0 ? 'var(--accent)' : 'var(--text)' }}>{t.over_days || '0'}</td>
                <td style={{ fontSize: 11 }}>{t.delay_reason || '—'}</td>
                <td className="mono">{rs(t.total_exp)}</td>
                <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(t.net_pl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReceivablesReport({ parties, getPartyBalance }: { parties: ReturnType<typeof useApp>['parties']; getPartyBalance: (id: string) => number }) {
  const rows = parties.filter(p => p.type === 'client').map(p => ({ name: p.name, city: p.city, bal: getPartyBalance(p.id) })).filter(r => r.bal > 0);
  const total = rows.reduce((s, r) => s + r.bal, 0);
  return (
    <>
      <div className="metric" style={{ marginBottom: '1rem', maxWidth: 200 }}><div className="metric-label">Total receivable</div><div className="metric-value red">{rs(total)}</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>City</th><th>Outstanding (Rs)</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((r, i) => (
              <tr key={i}><td>{r.name}</td><td>{r.city || '—'}</td><td className="mono" style={{ color: 'var(--red)' }}>{rs(r.bal)}</td></tr>
            )) : <tr><td colSpan={3}><div className="empty">No outstanding receivables.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PayablesReport({ parties, getPartyBalance }: { parties: ReturnType<typeof useApp>['parties']; getPartyBalance: (id: string) => number }) {
  const rows = parties.filter(p => p.type === 'fuel' || p.type === 'vendor').map(p => ({ name: p.name, type: p.type, bal: getPartyBalance(p.id) })).filter(r => r.bal < 0);
  const total = rows.reduce((s, r) => s + Math.abs(r.bal), 0);
  return (
    <>
      <div className="metric" style={{ marginBottom: '1rem', maxWidth: 200 }}><div className="metric-label">Total payable</div><div className="metric-value red">{rs(total)}</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Type</th><th>We owe (Rs)</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((r, i) => (
              <tr key={i}><td>{r.name}</td><td><span className="badge badge-gray">{r.type}</span></td><td className="mono" style={{ color: 'var(--red)' }}>{rs(Math.abs(r.bal))}</td></tr>
            )) : <tr><td colSpan={3}><div className="empty">No outstanding payables.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DieselReport({ trips, dieselBench }: { trips: ReturnType<typeof useApp>['trips']; dieselBench: number }) {
  const filtered = trips.filter(t => t.diesel_consumed > 0);
  const bench = dieselBench || 2.6;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <div className="metric"><div className="metric-label">Total diesel consumed</div><div className="metric-value">{filtered.reduce((s, t) => s + t.diesel_consumed, 0).toLocaleString()} ltr</div></div>
        <div className="metric"><div className="metric-label">Total diesel cost</div><div className="metric-value red">{rs(filtered.reduce((s, t) => s + t.diesel_cost, 0))}</div></div>
        <div className="metric"><div className="metric-label">Benchmark avg</div><div className="metric-value gold">{bench} km/ltr</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Trip #</th><th>Vehicle</th><th>Distance</th><th>Consumed (ltr)</th><th>Avg km/ltr</th><th>vs Benchmark</th><th>Cost</th></tr></thead>
          <tbody>
            {filtered.map(t => {
              const avg = parseFloat(t.diesel_avg) || 0;
              const diff = avg - bench;
              return (
                <tr key={t.id}>
                  <td className="mono">{t.no || '—'}</td>
                  <td className="mono">{t.vehicle}</td>
                  <td className="mono">{t.km ? t.km + ' km' : '—'}</td>
                  <td className="mono">{t.diesel_consumed}</td>
                  <td className="mono">{t.diesel_avg}</td>
                  <td className="mono" style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</td>
                  <td className="mono">{rs(t.diesel_cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
