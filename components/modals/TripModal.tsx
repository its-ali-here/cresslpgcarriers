'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { uid, today, rs } from '@/lib/utils';
import type { Trip, DieselPurchase, OtherExpense, ExpenseCategory, Party } from '@/lib/types';
import { SITE_TYPES as SITE_TYPES_LIST } from '@/lib/types';

interface Props {
  trip: Trip | null;
  onClose: () => void;
}

type TripForm = Omit<Trip, 'id' | 'total_exp' | 'net_pl' | 'diesel_purchases' | 'other_expense_items'>;

const DELAY_REASONS = [
  'Traffic / road conditions',
  'Loading delay',
  'Unloading delay',
  'Vehicle breakdown',
  'Weather',
  'Administrative / documentation',
  'Other',
];


function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DateInput({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: 'relative' }}>
      <input
        readOnly
        value={fmtDate(value)}
        placeholder={placeholder || 'DD MM YYYY'}
        style={{ cursor: 'pointer', ...style }}
        onClick={() => { try { ref.current?.showPicker?.(); } catch { ref.current?.focus(); } }}
      />
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
      />
    </div>
  );
}

function emptyForm(settings: { driverDaily: number; helperDaily: number; tripDays: number }): TripForm {
  return {
    no: '', month: '', load_date: today(), offload_date: '', vehicle: '', driver: '', helper: '', client: '',
    from_province: '', from_city: '', from: '', to_province: '', to_city: '', to: '',
    km: 0, exp_days: settings.tripDays || 0, act_days: 0, over_days: 0,
    lifted: 0, delivered: 0, lpg_diff: '', lpg_bill: 'absorbed', lpg_rate_kg: 0, lpg_gl_pkr: 0, lpg_rent_mt: 0, lpg_rent_total: 0,
    billed: 0, peshgi: 0, status: 'Completed',
    toll: 0, daily_rate: settings.driverDaily + settings.helperDaily, driver_exp: 0, helper_exp: 0,
    overday_cost: 0, chalan: 0, chalan_resp: '', tyre: 0, loadunload: 0,
    weigh: 0, excise: 0, motorway: 0, grease: 0, air: 0,
    engine_oil_litres: 0, engine_oil_price: 0, engine_oil_cost: 0,
    other_exp: 0,
    delay_reason: '', delay_notes: '',
    diesel_exp: 0, diesel_open: 0, diesel_close: 0, diesel_total: 0, diesel_consumed: 0, diesel_avg: '', diesel_cost: 0,
    notes: '',
  };
}

function tripToForm(t: Trip): TripForm {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, total_exp, net_pl, diesel_purchases, other_expense_items, ...rest } = t as Trip & { other_notes?: string };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { other_notes, ...clean } = rest;
  return clean as TripForm;
}

export default function TripModal({ trip, onClose }: Props) {
  const { fleet, parties, settings, provinces, cities, sites, cityDistances, expenseCategories, saveTrip, saveSite, saveParty, saveExpenseCategory } = useApp();
  const { userId, role, name: userName } = useUser();

  // Operators editing an approved trip see their pending changes (if any); admins always see main data
  const editSource = (role === 'operator' && trip?.pending_edit)
    ? { ...trip, ...(trip.pending_edit as Partial<Trip>) }
    : trip;

  const [form, setForm] = useState<TripForm>(() => {
    if (editSource) {
      const f = tripToForm(editSource as Trip);
      return { ...f, daily_rate: f.daily_rate || (settings.driverDaily + settings.helperDaily) };
    }
    return emptyForm(settings);
  });
  const [dieselRows, setDieselRows] = useState<DieselPurchase[]>(() => {
    if (!trip) return [];
    return ((role === 'operator' && trip.pending_edit?.diesel_purchases) || trip.diesel_purchases || []) as DieselPurchase[];
  });
  const [otherExpRows, setOtherExpRows] = useState<OtherExpense[]>(() => {
    if (!trip) return [];
    return ((role === 'operator' && trip.pending_edit?.other_expense_items) || trip.other_expense_items || []) as OtherExpense[];
  });
  const [delayReasons, setDelayReasons] = useState<string[]>(
    () => form.delay_reason ? form.delay_reason.split(', ').filter(Boolean) : []
  );

  // "Add new site" state
  const [fromSiteAdding, setFromSiteAdding] = useState(false);
  const [fromNewSiteName, setFromNewSiteName] = useState('');
  const [fromNewSiteType, setFromNewSiteType] = useState<typeof SITE_TYPES_LIST[number]>('Other');
  const [toSiteAdding, setToSiteAdding] = useState(false);
  const [toNewSiteName, setToNewSiteName] = useState('');
  const [toNewSiteType, setToNewSiteType] = useState<typeof SITE_TYPES_LIST[number]>('Other');

  const [clientAdding, setClientAdding] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [pendingCatRow, setPendingCatRow] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState('');

  const set = useCallback(<K extends keyof TripForm>(k: K, v: TripForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v })), []);

  const fuelSuppliers = parties.filter(p => p.type === 'fuel');
  const clients = parties.filter(p => p.type === 'client');

  function handleVehicleChange(reg: string) {
    setForm(prev => ({ ...prev, vehicle: reg }));
  }

  function tryFillKm(fromCityName: string, toCityName: string) {
    const fc = cities.find(c => c.name === fromCityName);
    const tc = cities.find(c => c.name === toCityName);
    if (!fc || !tc) return;
    const dist = cityDistances.find(d =>
      (d.from_city_id === fc.id && d.to_city_id === tc.id) ||
      (d.from_city_id === tc.id && d.to_city_id === fc.id)
    );
    if (dist) setForm(prev => ({ ...prev, km: dist.km }));
  }

  function handleFromProvince(prov: string) {
    setForm(prev => ({ ...prev, from_province: prov, from_city: '', from: '' }));
    setFromSiteAdding(false);
  }

  function handleFromCity(cityName: string) {
    setForm(prev => ({ ...prev, from_city: cityName, from: '' }));
    setFromSiteAdding(false);
    tryFillKm(cityName, form.to_city);
  }

  function handleToProvince(prov: string) {
    setForm(prev => ({ ...prev, to_province: prov, to_city: '', to: '' }));
    setToSiteAdding(false);
  }

  function handleToCity(cityName: string) {
    setForm(prev => ({ ...prev, to_city: cityName, to: '' }));
    setToSiteAdding(false);
    tryFillKm(form.from_city, cityName);
  }

  async function handleSaveFromSite() {
    const name = fromNewSiteName.trim();
    if (!name) return;
    const cityId = cities.find(c => c.name === form.from_city)?.id;
    if (!cityId) return;
    await saveSite({ id: uid(), city_id: cityId, name, type: fromNewSiteType });
    setForm(prev => ({ ...prev, from: name }));
    setFromSiteAdding(false);
    setFromNewSiteName('');
  }

  async function handleSaveToSite() {
    const name = toNewSiteName.trim();
    if (!name) return;
    const cityId = cities.find(c => c.name === form.to_city)?.id;
    if (!cityId) return;
    await saveSite({ id: uid(), city_id: cityId, name, type: toNewSiteType });
    setForm(prev => ({ ...prev, to: name }));
    setToSiteAdding(false);
    setToNewSiteName('');
  }

  async function handleSaveNewClient() {
    const name = newClientName.trim();
    if (!name) return;
    const newParty: Party = { id: uid(), type: 'client', name, contact: '', phone: '', city: '', addr: '', notes: '', opening: 0, bal_type: 'dr' };
    await saveParty(newParty);
    set('client', newParty.id);
    setClientAdding(false);
    setNewClientName('');
  }

  async function handleSaveNewCat() {
    const name = newCatName.trim();
    if (!name) return;
    const cat: ExpenseCategory = { id: uid(), name };
    await saveExpenseCategory(cat);
    if (pendingCatRow !== null) updateOtherExpRow(pendingCatRow, 'label', name);
    setPendingCatRow(null);
    setNewCatName('');
  }

  function calcActDays(loadDate: string, offloadDate: string) {
    if (!loadDate || !offloadDate) return;
    const diff = Math.max(0, Math.round(
      (new Date(offloadDate + 'T00:00:00').getTime() - new Date(loadDate + 'T00:00:00').getTime()) / 86400000
    ));
    calcOverDays(form.exp_days, diff);
  }

  function calcOverDays(expDays: number, actDays: number) {
    setForm(prev => {
      const rate = prev.daily_rate || 0;
      const over = Math.max(0, actDays - expDays);
      return {
        ...prev,
        exp_days: expDays, act_days: actDays, over_days: over,
        driver_exp: rate * actDays,
        overday_cost: rate * over,
      };
    });
  }

  function setDailyRate(rate: number) {
    setForm(prev => ({
      ...prev,
      daily_rate: rate,
      driver_exp: rate * prev.act_days,
      overday_cost: rate * prev.over_days,
    }));
  }

  function calcLpgDiff(lifted: number, delivered: number) {
    const diffNum = delivered - lifted;
    const diffStr = diffNum ? (diffNum > 0 ? '+' + diffNum : String(diffNum)) : '';
    setForm(prev => {
      const rentTotal = (prev.lpg_rent_mt || 0) * (lifted / 1000);
      const glPkr = diffNum * (prev.lpg_rate_kg || 0);
      return { ...prev, lifted, delivered, lpg_diff: diffStr, lpg_rent_total: rentTotal, lpg_gl_pkr: glPkr };
    });
  }

  function setLpgRentMt(val: number) {
    setForm(prev => ({ ...prev, lpg_rent_mt: val, lpg_rent_total: val * ((prev.lifted || 0) / 1000) }));
  }

  function setLpgRateKg(val: number) {
    setForm(prev => {
      const diffNum = (prev.delivered || 0) - (prev.lifted || 0);
      return { ...prev, lpg_rate_kg: val, lpg_gl_pkr: diffNum * val };
    });
  }

  function calcEngineOil(litres: number, price: number) {
    setForm(prev => ({ ...prev, engine_oil_litres: litres, engine_oil_price: price, engine_oil_cost: litres * price }));
  }

  function toggleDelayReason(reason: string) {
    setDelayReasons(prev => {
      const next = prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason];
      setForm(fp => ({ ...fp, delay_reason: next.join(', ') }));
      return next;
    });
  }

  function updateDieselRow(index: number, key: keyof DieselPurchase, value: string | number) {
    setDieselRows(prev => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [key]: value };
      if (key === 'litres' || key === 'price') {
        const ltr = key === 'litres' ? Number(value) : rows[index].litres;
        const prc = key === 'price' ? Number(value) : rows[index].price;
        rows[index].amount = ltr * prc;
      }
      const totalLtr = rows.reduce((s, r) => s + (r.litres || 0), 0);
      const totalCost = rows.reduce((s, r) => s + (r.amount || 0), 0);
      const open = form.diesel_open || 0;
      const close = form.diesel_close || 0;
      const consumed = open + totalLtr - close;
      const km = form.km || 0;
      const avg = consumed > 0 && km > 0 ? (km / consumed).toFixed(2) : '';
      setForm(fp => ({ ...fp, diesel_total: totalLtr, diesel_consumed: consumed, diesel_avg: avg, diesel_cost: totalCost }));
      return rows;
    });
  }

  function recalcDiesel(open: number, close: number) {
    const totalLtr = dieselRows.reduce((s, r) => s + (r.litres || 0), 0);
    const totalCost = dieselRows.reduce((s, r) => s + (r.amount || 0), 0);
    const consumed = open + totalLtr - close;
    const km = form.km || 0;
    const avg = consumed > 0 && km > 0 ? (km / consumed).toFixed(2) : '';
    setForm(prev => ({ ...prev, diesel_open: open, diesel_close: close, diesel_total: totalLtr, diesel_consumed: consumed, diesel_avg: avg, diesel_cost: totalCost }));
  }

  function addDieselRow() {
    setDieselRows(prev => [...prev, { date: today(), supplier: '', litres: 0, price: 0, amount: 0 }]);
  }

  function removeDieselRow(index: number) {
    setDieselRows(prev => {
      const rows = prev.filter((_, i) => i !== index);
      const totalLtr = rows.reduce((s, r) => s + (r.litres || 0), 0);
      const totalCost = rows.reduce((s, r) => s + (r.amount || 0), 0);
      const consumed = (form.diesel_open || 0) + totalLtr - (form.diesel_close || 0);
      const avg = consumed > 0 && form.km > 0 ? (form.km / consumed).toFixed(2) : '';
      setForm(fp => ({ ...fp, diesel_total: totalLtr, diesel_consumed: consumed, diesel_avg: avg, diesel_cost: totalCost }));
      return rows;
    });
  }

  function addOtherExpRow() {
    setOtherExpRows(prev => [...prev, { label: '', amount: 0 }]);
  }

  function updateOtherExpRow(index: number, key: keyof OtherExpense, value: string | number) {
    setOtherExpRows(prev => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [key]: value };
      return rows;
    });
  }

  function removeOtherExpRow(index: number) {
    setOtherExpRows(prev => prev.filter((_, i) => i !== index));
  }

  const otherExpTotal = otherExpRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const expFields: (keyof TripForm)[] = ['toll', 'driver_exp', 'overday_cost', 'engine_oil_cost', 'diesel_cost'];
  const totalExp = expFields.reduce((s, f) => s + (Number(form[f]) || 0), 0) + otherExpTotal;
  const lpgIncome = (form.lpg_rent_total || 0) + (form.lpg_gl_pkr || 0);
  const pl = lpgIncome - totalExp;

  const fromCitySites = sites.filter(s => cities.find(c => c.name === form.from_city)?.id === s.city_id);
  const toCitySites = sites.filter(s => cities.find(c => c.name === form.to_city)?.id === s.city_id);

  const [showErrors, setShowErrors] = useState(false);
  const errors = {
    load_date: !form.load_date,
    offload_date: !form.offload_date,
    vehicle: !form.vehicle,
    client: !form.client,
    from_province: !form.from_province,
    from_city: !form.from_city,
    from: !form.from && !fromSiteAdding,
    to_province: !form.to_province,
    to_city: !form.to_city,
    to: !form.to && !toSiteAdding,
    km: !(form.km > 0),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const e = (field: keyof typeof errors) =>
    showErrors && errors[field] ? { borderColor: 'var(--red)' } : undefined;

  async function handleSave() {
    if (hasErrors) { setShowErrors(true); return; }
    const id = trip?.id || uid();
    const isNew = !trip;
    const tripData = {
      ...form, id,
      total_exp: totalExp, net_pl: pl,
      other_exp: otherExpTotal, other_expense_items: otherExpRows,
      diesel_purchases: dieselRows,
    };

    if (role === 'operator' && !isNew && trip!.approved !== false) {
      await saveTrip({ ...trip!, pending_edit: { ...tripData, __edited_by: userName, __edited_at: new Date().toISOString() } });
    } else {
      await saveTrip({ ...tripData, ...(isNew && { approved: role === 'admin', created_by: userId }) });
    }
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">{trip ? 'Edit trip' : 'New trip'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">

            <div className="form-section">Trip info</div>
            <div className="form-group">
              <label>Load date</label>
              <DateInput value={form.load_date} onChange={v => { set('load_date', v); calcActDays(v, form.offload_date); }} style={e('load_date')} />
            </div>
            <div className="form-group">
              <label>Off-load date</label>
              <DateInput value={form.offload_date} onChange={v => { set('offload_date', v); calcActDays(form.load_date, v); }} style={e('offload_date')} />
            </div>
            <div className="form-group">
              <label>Vehicle (reg no.)</label>
              <select value={form.vehicle} style={e('vehicle')} onChange={ev => handleVehicleChange(ev.target.value)}>
                <option value="">— select —</option>
                {fleet.map(f => <option key={f.id} value={f.reg}>{f.reg}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Client</label>
              {clientAdding ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ flex: 1 }} placeholder="Client name" value={newClientName} onChange={ev => setNewClientName(ev.target.value)} onKeyDown={ev => ev.key === 'Enter' && handleSaveNewClient()} autoFocus />
                  <button className="btn btn-sm btn-primary" onClick={handleSaveNewClient}>Add</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setClientAdding(false); setNewClientName(''); }}>✕</button>
                </div>
              ) : (
                <select value={form.client} style={e('client')} onChange={ev => { if (ev.target.value === '__add_new__') setClientAdding(true); else set('client', ev.target.value); }}>
                  <option value="">— select —</option>
                  {clients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option value="__add_new__">+ Add new client</option>
                </select>
              )}
            </div>

            <div className="form-section">Route</div>
            <div className="form-group">
              <label>From (Province)</label>
              <select value={form.from_province} style={e('from_province')} onChange={ev => handleFromProvince(ev.target.value)}>
                <option value="">— select province —</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To (Province)</label>
              <select value={form.to_province} style={e('to_province')} onChange={ev => handleToProvince(ev.target.value)}>
                <option value="">— select province —</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>From (City)</label>
              <select value={form.from_city} style={e('from_city')} onChange={ev => handleFromCity(ev.target.value)} disabled={!form.from_province}>
                <option value="">— select city —</option>
                {cities.filter(c => provinces.find(p => p.name === form.from_province)?.id === c.province_id)
                  .map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To (City)</label>
              <select value={form.to_city} style={e('to_city')} onChange={ev => handleToCity(ev.target.value)} disabled={!form.to_province}>
                <option value="">— select city —</option>
                {cities.filter(c => provinces.find(p => p.name === form.to_province)?.id === c.province_id)
                  .map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>From (Site)</label>
              {fromSiteAdding ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input
                    style={{ flex: 2, minWidth: 120 }}
                    placeholder="Site name"
                    value={fromNewSiteName}
                    onChange={ev => setFromNewSiteName(ev.target.value)}
                    onKeyDown={ev => ev.key === 'Enter' && handleSaveFromSite()}
                    autoFocus
                  />
                  <select style={{ flex: 1, minWidth: 90 }} value={fromNewSiteType} onChange={ev => setFromNewSiteType(ev.target.value as typeof SITE_TYPES_LIST[number])}>
                    {SITE_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleSaveFromSite}>Add</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setFromSiteAdding(false); setFromNewSiteName(''); }}>✕</button>
                </div>
              ) : (
                <select
                  value={form.from}
                  style={e('from')}
                  onChange={ev => {
                    if (ev.target.value === '__add_new__') { setFromSiteAdding(true); }
                    else { set('from', ev.target.value); }
                  }}
                  disabled={!form.from_city}
                >
                  <option value="">— select site —</option>
                  {fromCitySites.map(s => <option key={s.id} value={s.name}>{s.name} ({s.type})</option>)}
                  <option value="__add_new__">+ Add new site</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>To (Site)</label>
              {toSiteAdding ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input
                    style={{ flex: 2, minWidth: 120 }}
                    placeholder="Site name"
                    value={toNewSiteName}
                    onChange={ev => setToNewSiteName(ev.target.value)}
                    onKeyDown={ev => ev.key === 'Enter' && handleSaveToSite()}
                    autoFocus
                  />
                  <select style={{ flex: 1, minWidth: 90 }} value={toNewSiteType} onChange={ev => setToNewSiteType(ev.target.value as typeof SITE_TYPES_LIST[number])}>
                    {SITE_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleSaveToSite}>Add</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setToSiteAdding(false); setToNewSiteName(''); }}>✕</button>
                </div>
              ) : (
                <select
                  value={form.to}
                  style={e('to')}
                  onChange={ev => {
                    if (ev.target.value === '__add_new__') { setToSiteAdding(true); }
                    else { set('to', ev.target.value); }
                  }}
                  disabled={!form.to_city}
                >
                  <option value="">— select site —</option>
                  {toCitySites.map(s => <option key={s.id} value={s.name}>{s.name} ({s.type})</option>)}
                  <option value="__add_new__">+ Add new site</option>
                </select>
              )}
            </div>

            <div className="form-group"><label>Distance (km)</label><input type="number" style={e('km')} value={form.km || ''} onChange={ev => set('km', Number(ev.target.value))} /></div>
            <div className="form-group"><label>Expected days</label><input type="number" value={form.exp_days || ''} onChange={ev => calcOverDays(Number(ev.target.value), form.act_days)} /></div>
            <div className="form-group"><label>Actual days</label><input type="number" readOnly value={form.act_days || ''} style={{ color: 'var(--accent)' }} /></div>
            <div className="form-group"><label>Over days</label><input type="number" readOnly value={form.over_days || ''} style={{ color: 'var(--accent)' }} /></div>

            <div className="form-section">Trip expenses</div>
            <div className="form-group"><label>Tolls (Rs)</label><input type="number" value={form.toll || ''} onChange={ev => set('toll', Number(ev.target.value))} /></div>
            <div className="form-group"><label>Daily allowance rate (Rs/day)</label><input type="number" value={form.daily_rate || ''} onChange={ev => setDailyRate(Number(ev.target.value))} /></div>
            <div className="form-group">
              <label>Driver + Helper total allowance (Rs)</label>
              <input readOnly value={form.driver_exp || ''} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} title={`Rs ${form.daily_rate}/day × ${form.act_days} days`} />
            </div>
            <div className="form-group"><label>Over-days extra cost (Rs)</label><input readOnly value={form.overday_cost || ''} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} title={`Rs ${form.daily_rate}/day × ${form.over_days} over days`} /></div>
            <div className="form-group">
              <label>Engine oil</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" style={{ flex: 1, minWidth: 0 }} placeholder="Ltrs" value={form.engine_oil_litres || ''} onChange={ev => calcEngineOil(Number(ev.target.value), form.engine_oil_price)} />
                <input type="number" style={{ flex: 1, minWidth: 0 }} placeholder="Rs/ltr" value={form.engine_oil_price || ''} onChange={ev => calcEngineOil(form.engine_oil_litres, Number(ev.target.value))} />
                <input readOnly style={{ flex: 1, minWidth: 0, fontFamily: 'var(--mono)' }} placeholder="Cost" value={form.engine_oil_cost || ''} />
              </div>
            </div>
            <div className="form-group full">
              <label>Other expenses</label>
              <table className="diesel-table">
                <thead>
                  <tr><th>Description</th><th>Amount (Rs)</th><th></th></tr>
                </thead>
                <tbody>
                  {otherExpRows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        {pendingCatRow === i ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input style={{ flex: 1, minWidth: 140 }} placeholder="New category name" value={newCatName} onChange={ev => setNewCatName(ev.target.value)} onKeyDown={ev => ev.key === 'Enter' && handleSaveNewCat()} autoFocus />
                            <button className="btn btn-sm btn-primary" onClick={handleSaveNewCat}>Add</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setPendingCatRow(null); setNewCatName(''); }}>✕</button>
                          </div>
                        ) : (
                          <select
                            value={row.label}
                            style={{ minWidth: 180 }}
                            onChange={ev => {
                              if (ev.target.value === '__add_new__') { setPendingCatRow(i); setNewCatName(''); }
                              else { updateOtherExpRow(i, 'label', ev.target.value); }
                            }}
                          >
                            <option value="">— select —</option>
                            {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            <option value="__add_new__">+ Add new category</option>
                          </select>
                        )}
                      </td>
                      <td><input type="number" value={row.amount || ''} style={{ minWidth: 100, fontFamily: 'var(--mono)' }} onChange={ev => updateOtherExpRow(i, 'amount', Number(ev.target.value))} /></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => removeOtherExpRow(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={addOtherExpRow}>+ Add expense</button>
            </div>

            <div className="form-section">Over-days reason</div>
            <div className="form-group full">
              <label>Reasons for delay</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 4 }}>
                {DELAY_REASONS.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={delayReasons.includes(r)}
                      onChange={() => toggleDelayReason(r)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group full"><label>Delay notes</label><input value={form.delay_notes} onChange={e => set('delay_notes', e.target.value)} /></div>

            <div className="form-section">Diesel log</div>
            <div className="form-group"><label>Opening diesel stock (ltr)</label><input type="number" value={form.diesel_open || ''} onChange={e => recalcDiesel(Number(e.target.value), form.diesel_close)} /></div>
            <div className="form-group"><label>Closing diesel stock (ltr)</label><input type="number" value={form.diesel_close || ''} onChange={e => recalcDiesel(form.diesel_open, Number(e.target.value))} /></div>
            <div className="form-group"><label>Expected consumption (ltr)</label><input type="number" value={form.diesel_exp || ''} onChange={e => set('diesel_exp', Number(e.target.value))} /></div>
            <div className="form-group full">
              <label>Diesel purchases</label>
              <table className="diesel-table">
                <thead>
                  <tr><th>Date</th><th>Supplier</th><th>Litres</th><th>Price/ltr (Rs)</th><th>Amount (Rs)</th><th></th></tr>
                </thead>
                <tbody>
                  {dieselRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ minWidth: 130 }}>
                        <DateInput value={row.date} onChange={v => updateDieselRow(i, 'date', v)} />
                      </td>
                      <td>
                        <select value={row.supplier} style={{ minWidth: 120 }} onChange={e => updateDieselRow(i, 'supplier', e.target.value)}>
                          <option value="">— supplier —</option>
                          {fuelSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" value={row.litres || ''} style={{ minWidth: 70 }} onChange={e => updateDieselRow(i, 'litres', Number(e.target.value))} /></td>
                      <td><input type="number" value={row.price || ''} style={{ minWidth: 80 }} onChange={e => updateDieselRow(i, 'price', Number(e.target.value))} /></td>
                      <td><input readOnly value={row.amount || ''} style={{ minWidth: 90, fontFamily: 'var(--mono)' }} /></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => removeDieselRow(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={addDieselRow}>+ Add purchase</button>
            </div>
            <div className="form-group"><label>Total diesel purchased (ltr)</label><input readOnly value={form.diesel_total || ''} style={{ fontFamily: 'var(--mono)' }} /></div>
            <div className="form-group"><label>Total diesel consumed (ltr)</label><input readOnly value={form.diesel_consumed || ''} style={{ fontFamily: 'var(--mono)' }} /></div>
            <div className="form-group"><label>Diesel average (km/ltr)</label><input readOnly value={form.diesel_avg} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} /></div>
            <div className="form-group"><label>Total diesel cost (Rs)</label><input readOnly value={form.diesel_cost || ''} style={{ fontFamily: 'var(--mono)' }} /></div>

            <div className="form-section">LPG</div>
            <div className="form-group"><label>Weight lifted (kg)</label><input type="number" value={form.lifted || ''} onChange={e => calcLpgDiff(Number(e.target.value), form.delivered)} /></div>
            <div className="form-group"><label>Weight delivered (kg)</label><input type="number" value={form.delivered || ''} onChange={e => calcLpgDiff(form.lifted, Number(e.target.value))} /></div>
            <div className="form-group"><label>Gain / loss (kg)</label>
              <input readOnly value={form.lpg_diff} style={{ fontFamily: 'var(--mono)', color: form.lpg_diff.startsWith('+') ? 'var(--green)' : form.lpg_diff.startsWith('-') ? 'var(--red)' : 'var(--text)' }} />
            </div>
            <div className="form-group"><label>Rate / kg (Rs)</label><input type="number" value={form.lpg_rate_kg || ''} onChange={e => setLpgRateKg(Number(e.target.value))} /></div>
            <div className="form-group"><label>Gain / loss amount (Rs)</label>
              <input readOnly value={form.lpg_gl_pkr ? form.lpg_gl_pkr.toFixed(2) : ''} style={{ fontFamily: 'var(--mono)', color: (form.lpg_gl_pkr || 0) > 0 ? 'var(--green)' : (form.lpg_gl_pkr || 0) < 0 ? 'var(--red)' : 'var(--text)' }} />
            </div>
            <div className="form-group"><label>Rent/MT (Rs)</label><input type="number" value={form.lpg_rent_mt || ''} onChange={e => setLpgRentMt(Number(e.target.value))} /></div>
            <div className="form-group"><label>Base rent (Rs)</label><input readOnly value={form.lpg_rent_total ? form.lpg_rent_total.toFixed(2) : ''} style={{ fontFamily: 'var(--mono)' }} /></div>
            <div className="form-group"><label>Adjusted rent (Rs)</label><input readOnly value={lpgIncome ? lpgIncome.toFixed(2) : ''} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} /></div>

            <div className="form-section">Trip P&amp;L summary</div>
            <div className="form-group full">
              <div className="cost-card">
                <div className="cost-row"><span className="cost-label">LPG rent (base)</span><span className="cost-val">{rs(form.lpg_rent_total)}</span></div>
                {(form.lpg_gl_pkr || 0) !== 0 && <div className="cost-row"><span className="cost-label">Gain / loss adjustment</span><span className="cost-val" style={{ color: (form.lpg_gl_pkr || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{rs(form.lpg_gl_pkr)}</span></div>}
                <div className="cost-row"><span className="cost-label">Adjusted income</span><span className="cost-val">{rs(lpgIncome)}</span></div>
                <div className="cost-row"><span className="cost-label">Total expenses</span><span className="cost-val" style={{ color: 'var(--red)' }}>{rs(totalExp)}</span></div>
                <div className={`cost-row ${pl >= 0 ? 'profit' : 'loss'}`}><span className="cost-label">Net P/L</span><span>{rs(pl)}</span></div>
              </div>
            </div>

            <div className="form-group full"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save trip</button>
        </div>
      </div>
    </div>
  );
}
