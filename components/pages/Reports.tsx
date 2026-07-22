'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '@/context/AppContext';
import { rs, today } from '@/lib/utils';
import { weightedAvgKmLtr, vehicleExpenseRisk } from '@/lib/fleetPerformance';
import type { Trip } from '@/lib/types';

type ReportTab = 'summary' | 'tripwise' | 'bowserwise' | 'monthwise';

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
  const [tab, setTab] = useState<ReportTab>('summary');
  const { trips, expenses, fleet, settings } = useApp();

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
    ['summary', 'Summary'],
    ['tripwise', 'Trip Report'],
    ['bowserwise', 'Bowserwise'],
    ['monthwise', 'Monthwise'],
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

      {tab === 'summary'    && <SummaryReport trips={filteredTrips} expenses={expenses} fleet={fleet} company={company} dateRange={dateRange} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'tripwise'   && <TripwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
      {tab === 'bowserwise' && <BowserwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
      {tab === 'monthwise'  && <MonthwiseReport trips={filteredTrips} company={company} dateRange={dateRange} />}
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function SummaryReport({ trips, expenses, fleet, company, dateRange, dateFrom, dateTo }: {
  trips: Trip[];
  expenses: ReturnType<typeof useApp>['expenses'];
  fleet: ReturnType<typeof useApp>['fleet'];
  company: string;
  dateRange: string;
  dateFrom: string;
  dateTo: string;
}) {
  const filteredExp = expenses.filter(e => !e.date || (e.date >= dateFrom && e.date <= dateTo));
  const revenue      = trips.reduce((s, t) => s + (t.lpg_rent_total || 0), 0);
  const tripExp       = trips.reduce((s, t) => s + (t.total_exp || 0), 0);
  const genExp        = filteredExp.reduce((s, e) => s + e.amount, 0);
  const net           = revenue - tripExp - genExp;
  const dieselConsumed = trips.reduce((s, t) => s + (t.diesel_consumed || 0), 0);
  const dieselCost     = trips.reduce((s, t) => s + (t.diesel_cost || 0), 0);
  const totalKm        = trips.filter(t => t.diesel_consumed > 0).reduce((s, t) => s + (t.km || 0), 0);
  const dieselAvg       = dieselConsumed > 0 ? totalKm / dieselConsumed : 0;
  const activeFleet     = fleet.filter(f => f.status === 'Running in fleet').length;

  function handlePDF() {
    const head = [['Metric', 'Value']];
    const body = [
      ['Total rent', rs(revenue)],
      ['Trip expenses', rs(tripExp)],
      ['Other expenses', rs(genExp)],
      ['Net profit', rs(net)],
      ['Total diesel consumed', `${dieselConsumed.toLocaleString()} ltr`],
      ['Total diesel cost', rs(dieselCost)],
      ['Total diesel average', dieselAvg ? `${dieselAvg.toFixed(2)} km/ltr` : '—'],
      ['Fleet size', `${fleet.length} (${activeFleet} active)`],
    ];
    viewPDF(company, 'Summary', dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
        <div className="metric"><div className="metric-label">Total rent</div><div className="metric-value green">{rs(revenue)}</div><div className="metric-sub">from {trips.length} trips</div></div>
        <div className="metric"><div className="metric-label">Trip expenses</div><div className="metric-value red">{rs(tripExp)}</div></div>
        <div className="metric"><div className="metric-label">Other expenses</div><div className="metric-value red">{rs(genExp)}</div></div>
        <div className="metric"><div className="metric-label">Net profit</div><div className={`metric-value ${net >= 0 ? 'green' : 'red'}`}>{rs(net)}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <div className="metric"><div className="metric-label">Total diesel consumed</div><div className="metric-value">{dieselConsumed.toLocaleString()} ltr</div></div>
        <div className="metric"><div className="metric-label">Total diesel cost</div><div className="metric-value red">{rs(dieselCost)}</div></div>
        <div className="metric"><div className="metric-label">Total diesel average</div><div className="metric-value gold">{dieselAvg ? dieselAvg.toFixed(2) : '—'} km/ltr</div></div>
        <div className="metric"><div className="metric-label">Fleet size</div><div className="metric-value">{fleet.length}</div><div className="metric-sub">{activeFleet} active</div></div>
      </div>
    </>
  );
}

// ─── Trip Report ──────────────────────────────────────────────────────────────

function TripwiseReport({ trips, company, dateRange }: { trips: Trip[]; company: string; dateRange: string }) {
  function handlePDF() {
    const head = [['Trip #', 'Load Date', 'Vehicle', 'Route', 'LPG Lifted', 'LPG Delivered', 'Gain/Loss', 'Rent/MT', 'Rent Total', 'Act. Days', 'Total Exp', 'Net P/L']];
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
              <th>Rent/MT</th><th>Rent Total</th><th>Act. Days</th>
              <th>Total Exp</th><th>Net P/L</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={12}><div className="empty">No trips in this period.</div></td></tr>
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
  type Row = { vehicle: string; count: number; km: number; lifted: number; delivered: number; rent: number; exp: number; pl: number; avgKmLtr: number; riskShare: number | null };

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const map = new Map<string, Row>();
  for (const t of trips) {
    const v = t.vehicle || '(unknown)';
    if (!map.has(v)) map.set(v, { vehicle: v, count: 0, km: 0, lifted: 0, delivered: 0, rent: 0, exp: 0, pl: 0, avgKmLtr: 0, riskShare: null });
    const r = map.get(v)!;
    r.count++;
    r.km       += t.km || 0;
    r.lifted   += t.lifted || 0;
    r.delivered += t.delivered || 0;
    r.rent     += t.lpg_rent_total || 0;
    r.exp      += t.total_exp || 0;
    r.pl       += t.net_pl || 0;
  }

  // Weighted avg km/ltr and expense-risk share per vehicle
  const riskByVehicle = vehicleExpenseRisk(trips);
  for (const [v, r] of map) {
    const vTrips = trips.filter(t => (t.vehicle || '(unknown)') === v);
    r.avgKmLtr = weightedAvgKmLtr(vTrips) ?? 0;
    r.riskShare = riskByVehicle.get(v)?.riskShare ?? null;
  }

  const rows = [...map.values()].sort((a, b) => a.vehicle.localeCompare(b.vehicle));
  const vehicleTrips = selectedVehicle
    ? trips.filter(t => (t.vehicle || '(unknown)') === selectedVehicle).sort((a, b) => (b.load_date || '').localeCompare(a.load_date || ''))
    : [];

  function handlePDF() {
    const head = [['Vehicle', '# Trips', 'Total KM', 'LPG Lifted (kg)', 'LPG Delivered (kg)', 'Total Rent', 'Total Exp', 'Net P/L', 'Avg km/ltr', 'Risk %']];
    const body = rows.map(r => [
      r.vehicle, r.count, fmtNum(r.km), fmtNum(r.lifted), fmtNum(r.delivered),
      rs(r.rent), rs(r.exp), rs(r.pl),
      r.avgKmLtr ? r.avgKmLtr.toFixed(2) : '—',
      r.riskShare !== null ? `${Math.round(r.riskShare * 100)}%` : '—',
    ]);
    viewPDF(company, 'Bowserwise Report', dateRange, head, body);
  }

  function handleVehiclePDF() {
    if (!selectedVehicle) return;
    const head = [['Trip #', 'Load Date', 'Route', 'LPG Lifted', 'LPG Delivered', 'Rent Total', 'Act. Days', 'Total Exp', 'Net P/L']];
    const body = vehicleTrips.map(t => [
      t.no || '—',
      fmtDate(t.load_date),
      `${t.from_city || ''}${t.from_city && t.to_city ? ' → ' : ''}${t.to_city || ''}`,
      fmtNum(t.lifted),
      fmtNum(t.delivered),
      rs(t.lpg_rent_total),
      t.act_days || '—',
      rs(t.total_exp),
      rs(t.net_pl),
    ]);
    viewPDF(company, `Trips — ${selectedVehicle}`, dateRange, head, body);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePDF}>View PDF</button>
      </div>
      <div className="table-wrap" style={{ marginBottom: selectedVehicle ? '1.5rem' : 0 }}>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th><th># Trips</th><th>Total KM</th><th>LPG Lifted (kg)</th>
              <th>LPG Delivered (kg)</th><th>Total Rent</th><th>Total Exp</th><th>Net P/L</th><th>Avg km/ltr</th><th>Risk %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10}><div className="empty">No trips in this period.</div></td></tr>
            ) : rows.map(r => (
              <tr
                key={r.vehicle}
                onClick={() => setSelectedVehicle(prev => prev === r.vehicle ? null : r.vehicle)}
                style={{ cursor: 'pointer', background: selectedVehicle === r.vehicle ? 'var(--bg3)' : undefined }}
              >
                <td className="mono">{r.vehicle}</td>
                <td className="mono">{r.count}</td>
                <td className="mono">{r.km ? fmtNum(r.km) + ' km' : '—'}</td>
                <td className="mono">{fmtNum(r.lifted)}</td>
                <td className="mono">{fmtNum(r.delivered)}</td>
                <td className="mono">{rs(r.rent)}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{rs(r.exp)}</td>
                <td className="mono" style={{ color: r.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(r.pl)}</td>
                <td className="mono">{r.avgKmLtr ? r.avgKmLtr.toFixed(2) : '—'}</td>
                <td className="mono">{r.riskShare !== null ? `${Math.round(r.riskShare * 100)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVehicle && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 0.75rem' }}>
            <div className="section-label" style={{ margin: 0 }}>Trips — {selectedVehicle}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleVehiclePDF}>View PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVehicle(null)}>✕ Close</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trip #</th><th>Load Date</th><th>Route</th><th>LPG Lifted</th>
                  <th>LPG Delivered</th><th>Rent Total</th><th>Act. Days</th><th>Total Exp</th><th>Net P/L</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTrips.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty">No trips for this vehicle in this period.</div></td></tr>
                ) : vehicleTrips.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{t.no || '—'}</td>
                    <td>{fmtDate(t.load_date)}</td>
                    <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                    <td className="mono">{fmtNum(t.lifted)}</td>
                    <td className="mono">{fmtNum(t.delivered)}</td>
                    <td className="mono">{rs(t.lpg_rent_total)}</td>
                    <td className="mono">{t.act_days || '—'}</td>
                    <td className="mono">{rs(t.total_exp)}</td>
                    <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(t.net_pl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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

