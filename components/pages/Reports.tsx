'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '@/context/AppContext';
import { rs, today } from '@/lib/utils';
import type { Trip } from '@/lib/types';

type ReportTab = 'pl' | 'tripwise' | 'bowserwise' | 'monthwise' | 'diesel';

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtNum(n: number) {
  return n ? n.toLocaleString('en-PK') : '0';
}

function viewPDF(
  company: string,
  title: string,
  dateRange: string,
  head: string[][],
  body: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(13);
  doc.text(company, 14, 14);
  doc.setFontSize(9);
  doc.text(title, 14, 21);
  doc.text(dateRange, 14, 27);
  autoTable(doc, {
    startY: 33,
    head,
    body,
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [30, 41, 59] },
  });
  window.open(doc.output('bloburl'), '_blank');
}

export default function Reports() {
  const [tab, setTab] = useState<ReportTab>('pl');
  const { trips, expenses, settings } = useApp();

  const yearStart = new Date().getFullYear() + '-01-01';
  const [dateFrom, setDateFrom] = useState(yearStart);
  const [dateTo, setDateTo] = useState(today());

  const filteredTrips = trips.filter(t => {
    if (!t.load_date) return false;
    return t.load_date >= dateFrom && t.load_date <= dateTo;
  });

  const dateRange = `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`;
  const company = settings.company || 'CRESS LPG CARRIERS';

  const TABS: [ReportTab, string][] = [
    ['pl', 'P&L Summary'],
    ['tripwise', 'Trip Report'],
    ['bowserwise', 'Bowserwise'],
    ['monthwise', 'Monthwise'],
    ['diesel', 'Diesel Analysis'],
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Reports</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)' }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} />
          <label style={{ fontSize: 12, color: 'var(--text2)' }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([id, label]) => (
          <div key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      {tab === 'pl'         && <PLReport trips={filteredTrips} expenses={expenses} company={company} dateRange={dateRange} dateFrom={dateFrom} />}
      {tab === 'tripwise'   && <TripwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
      {tab === 'bowserwise' && <BowserwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
      {tab === 'monthwise'  && <MonthwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
      {tab === 'diesel'     && <DieselReport trips={filteredTrips} dieselBench={settings.dieselBench} company={company} dateRange={dateRange} />}
    </div>
  );
}

// ─── P&L Summary ─────────────────────────────────────────────────────────────

function PLReport({ trips, expenses, company, dateRange, dateFrom }: {
  trips: Trip[];
  expenses: ReturnType<typeof useApp>['expenses'];
  company: string;
  dateRange: string;
  dateFrom: string;
}) {
  const filteredExp = expenses.filter(e => !e.date || e.date >= dateFrom);
  const revenue   = trips.reduce((s, t) => s + (t.lpg_rent_total || 0), 0);
  const tripExp   = trips.reduce((s, t) => s + (t.total_exp || 0), 0);
  const genExp    = filteredExp.reduce((s, e) => s + e.amount, 0);
  const net       = revenue - tripExp - genExp;

  function handlePDF() {
    const head = [['Trip #', 'Load Date', 'Vehicle', 'Route', 'Rent Total', 'Expenses', 'Net P/L', 'Cost/ton']];
    const body = trips.map(t => [
      t.no || '—',
      fmtDate(t.load_date),
      t.vehicle || '—',
      `${t.from_city || ''}${t.from_city && t.to_city ? ' → ' : ''}${t.to_city || ''}`,
      rs(t.lpg_rent_total),
      rs(t.total_exp),
      rs(t.net_pl),
      t.lifted > 0 ? 'Rs ' + (t.total_exp / t.lifted * 1000).toFixed(0) + '/ton' : '—',
    ]);
    viewPDF(company, 'P&L Summary', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <div className="metric"><div className="metric-label">Total rent</div><div className="metric-value green">{rs(revenue)}</div><div className="metric-sub">from {trips.length} trips</div></div>
        <div className="metric"><div className="metric-label">Trip expenses</div><div className="metric-value red">{rs(tripExp)}</div></div>
        <div className="metric"><div className="metric-label">General expenses</div><div className="metric-value red">{rs(genExp)}</div></div>
        <div className="metric"><div className="metric-label">Net profit</div><div className={`metric-value ${net >= 0 ? 'green' : 'red'}`}>{rs(net)}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Trip #</th><th>Load Date</th><th>Vehicle</th><th>Route</th><th>Rent Total</th><th>Expenses</th><th>Net P/L</th><th>Cost/ton</th></tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">No trips in this period.</div></td></tr>
            ) : trips.map(t => (
              <tr key={t.id}>
                <td className="mono">{t.no || '—'}</td>
                <td>{fmtDate(t.load_date)}</td>
                <td className="mono">{t.vehicle || '—'}</td>
                <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                <td className="mono">{rs(t.lpg_rent_total)}</td>
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

// ─── Trip Report ──────────────────────────────────────────────────────────────

function TripwiseReport({ trips, company, dateRange }: { trips: Trip[]; company: string; dateRange: string }) {
  function handlePDF() {
    const head = [['Trip #', 'Load Date', 'Vehicle', 'Route', 'LPG Lifted', 'LPG Delivered', 'Gain/Loss', 'Rent/MT', 'Rent Total', 'Act. Days', 'Over Days', 'Total Exp', 'Net P/L']];
    const body = trips.map(t => [
      t.no || '—',
      fmtDate(t.load_date),
      t.vehicle || '—',
      `${t.from_city || ''}${t.from_city && t.to_city ? ' → ' : ''}${t.to_city || ''}`,
      fmtNum(t.lifted),
      fmtNum(t.delivered),
      t.lpg_diff || '0',
      rs(t.lpg_rent_mt),
      rs(t.lpg_rent_total),
      t.act_days || '—',
      t.over_days || '0',
      rs(t.total_exp),
      rs(t.net_pl),
    ]);
    viewPDF(company, 'Trip Report', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip #</th><th>Load Date</th><th>Vehicle</th><th>Route</th>
              <th>LPG Lifted</th><th>LPG Delivered</th><th>Gain/Loss</th>
              <th>Rent/MT</th><th>Rent Total</th><th>Act. Days</th><th>Over Days</th>
              <th>Total Exp</th><th>Net P/L</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={13}><div className="empty">No trips in this period.</div></td></tr>
            ) : trips.map(t => {
              const diff = parseFloat(t.lpg_diff);
              return (
                <tr key={t.id}>
                  <td className="mono">{t.no || '—'}</td>
                  <td>{fmtDate(t.load_date)}</td>
                  <td className="mono">{t.vehicle || '—'}</td>
                  <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                  <td className="mono">{t.lifted ? fmtNum(t.lifted) : ''}</td>
                  <td className="mono">{t.delivered ? fmtNum(t.delivered) : ''}</td>
                  <td className="mono" style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : undefined }}>{t.lpg_diff || '0'}</td>
                  <td className="mono">{t.lpg_rent_mt ? rs(t.lpg_rent_mt) : ''}</td>
                  <td className="mono">{t.lpg_rent_total ? rs(t.lpg_rent_total) : ''}</td>
                  <td className="mono">{t.act_days || '—'}</td>
                  <td className="mono" style={{ color: t.over_days > 0 ? 'var(--accent)' : undefined }}>{t.over_days || '0'}</td>
                  <td className="mono">{rs(t.total_exp)}</td>
                  <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(t.net_pl)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Bowserwise ───────────────────────────────────────────────────────────────

function BowserwiseReport({ trips, company, dateRange }: { trips: Trip[]; company: string; dateRange: string }) {
  type Row = { vehicle: string; count: number; km: number; lifted: number; delivered: number; rent: number; exp: number; pl: number; avgKmLtr: number };

  const map = new Map<string, Row>();
  for (const t of trips) {
    const v = t.vehicle || '(unknown)';
    if (!map.has(v)) map.set(v, { vehicle: v, count: 0, km: 0, lifted: 0, delivered: 0, rent: 0, exp: 0, pl: 0, avgKmLtr: 0 });
    const r = map.get(v)!;
    r.count++;
    r.km       += t.km || 0;
    r.lifted   += t.lifted || 0;
    r.delivered += t.delivered || 0;
    r.rent     += t.lpg_rent_total || 0;
    r.exp      += t.total_exp || 0;
    r.pl       += t.net_pl || 0;
  }

  // Weighted avg km/ltr per vehicle
  for (const [v, r] of map) {
    const vTrips = trips.filter(t => (t.vehicle || '(unknown)') === v && t.diesel_consumed > 0);
    const totalConsumed = vTrips.reduce((s, t) => s + t.diesel_consumed, 0);
    const totalKm       = vTrips.reduce((s, t) => s + (t.km || 0), 0);
    r.avgKmLtr = totalConsumed > 0 ? totalKm / totalConsumed : 0;
  }

  const rows = [...map.values()].sort((a, b) => a.vehicle.localeCompare(b.vehicle));

  function handlePDF() {
    const head = [['Vehicle', '# Trips', 'Total KM', 'LPG Lifted (kg)', 'LPG Delivered (kg)', 'Total Rent', 'Total Exp', 'Net P/L', 'Avg km/ltr']];
    const body = rows.map(r => [
      r.vehicle, r.count, fmtNum(r.km), fmtNum(r.lifted), fmtNum(r.delivered),
      rs(r.rent), rs(r.exp), rs(r.pl),
      r.avgKmLtr ? r.avgKmLtr.toFixed(2) : '—',
    ]);
    viewPDF(company, 'Bowserwise Report', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th><th># Trips</th><th>Total KM</th><th>LPG Lifted (kg)</th>
              <th>LPG Delivered (kg)</th><th>Total Rent</th><th>Total Exp</th><th>Net P/L</th><th>Avg km/ltr</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9}><div className="empty">No trips in this period.</div></td></tr>
            ) : rows.map(r => (
              <tr key={r.vehicle}>
                <td className="mono">{r.vehicle}</td>
                <td className="mono">{r.count}</td>
                <td className="mono">{r.km ? fmtNum(r.km) + ' km' : '—'}</td>
                <td className="mono">{fmtNum(r.lifted)}</td>
                <td className="mono">{fmtNum(r.delivered)}</td>
                <td className="mono">{rs(r.rent)}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{rs(r.exp)}</td>
                <td className="mono" style={{ color: r.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(r.pl)}</td>
                <td className="mono">{r.avgKmLtr ? r.avgKmLtr.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Monthwise ────────────────────────────────────────────────────────────────

function MonthwiseReport({ trips, company, dateRange }: { trips: Trip[]; company: string; dateRange: string }) {
  type Row = { key: string; label: string; count: number; lifted: number; rent: number; exp: number; pl: number };

  const map = new Map<string, Row>();
  for (const t of trips) {
    if (!t.load_date) continue;
    const key = t.load_date.slice(0, 7);
    if (!map.has(key)) {
      const d = new Date(key + '-01');
      const label = d.toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
      map.set(key, { key, label, count: 0, lifted: 0, rent: 0, exp: 0, pl: 0 });
    }
    const r = map.get(key)!;
    r.count++;
    r.lifted += t.lifted || 0;
    r.rent   += t.lpg_rent_total || 0;
    r.exp    += t.total_exp || 0;
    r.pl     += t.net_pl || 0;
  }

  const rows = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));

  function handlePDF() {
    const head = [['Month', '# Trips', 'LPG Lifted (kg)', 'Total Rent', 'Total Exp', 'Net P/L']];
    const body = rows.map(r => [r.label, r.count, fmtNum(r.lifted), rs(r.rent), rs(r.exp), rs(r.pl)]);
    viewPDF(company, 'Monthwise Report', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Month</th><th># Trips</th><th>LPG Lifted (kg)</th><th>Total Rent</th><th>Total Exp</th><th>Net P/L</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}><div className="empty">No trips in this period.</div></td></tr>
            ) : rows.map(r => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="mono">{r.count}</td>
                <td className="mono">{fmtNum(r.lifted)}</td>
                <td className="mono">{rs(r.rent)}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{rs(r.exp)}</td>
                <td className="mono" style={{ color: r.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(r.pl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Diesel Analysis ──────────────────────────────────────────────────────────

function DieselReport({ trips, dieselBench, company, dateRange }: {
  trips: Trip[];
  dieselBench: number;
  company: string;
  dateRange: string;
}) {
  const filtered = trips.filter(t => t.diesel_consumed > 0);
  const bench = dieselBench || 2.6;

  function handlePDF() {
    const head = [['Trip #', 'Load Date', 'Vehicle', 'Distance', 'Consumed (ltr)', 'Avg km/ltr', 'vs Benchmark', 'Cost']];
    const body = filtered.map(t => {
      const avg = parseFloat(t.diesel_avg) || 0;
      const diff = avg - bench;
      return [
        t.no || '—',
        fmtDate(t.load_date),
        t.vehicle || '—',
        t.km ? t.km + ' km' : '—',
        t.diesel_consumed,
        t.diesel_avg || '—',
        (diff >= 0 ? '+' : '') + diff.toFixed(2),
        rs(t.diesel_cost),
      ];
    });
    viewPDF(company, 'Diesel Analysis', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        <div className="metric"><div className="metric-label">Total diesel consumed</div><div className="metric-value">{filtered.reduce((s, t) => s + t.diesel_consumed, 0).toLocaleString()} ltr</div></div>
        <div className="metric"><div className="metric-label">Total diesel cost</div><div className="metric-value red">{rs(filtered.reduce((s, t) => s + t.diesel_cost, 0))}</div></div>
        <div className="metric"><div className="metric-label">Benchmark avg</div><div className="metric-value gold">{bench} km/ltr</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Trip #</th><th>Load Date</th><th>Vehicle</th><th>Distance</th><th>Consumed (ltr)</th><th>Avg km/ltr</th><th>vs Benchmark</th><th>Cost</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">No diesel data in this period.</div></td></tr>
            ) : filtered.map(t => {
              const avg = parseFloat(t.diesel_avg) || 0;
              const diff = avg - bench;
              return (
                <tr key={t.id}>
                  <td className="mono">{t.no || '—'}</td>
                  <td>{fmtDate(t.load_date)}</td>
                  <td className="mono">{t.vehicle || '—'}</td>
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
