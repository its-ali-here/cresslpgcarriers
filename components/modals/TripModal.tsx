'use client';

import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, today, rs } from '@/lib/utils';
import type { Trip, DieselPurchase } from '@/lib/types';

interface Props {
  trip: Trip | null;
  onClose: () => void;
}

type TripForm = Omit<Trip, 'id' | 'total_exp' | 'net_pl' | 'diesel_purchases'>;

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Overlays a transparent native date input on a formatted display input.
function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input readOnly value={fmtDate(value)} placeholder={placeholder || 'DD MM YYYY'} style={{ cursor: 'pointer' }} />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
      />
    </div>
  );
}

function emptyForm(settings: { driverDaily: number; helperDaily: number; tripDays: number }): TripForm {
  return {
    no: '', month: '', load_date: today(), offload_date: '', vehicle: '', driver: '', helper: '', client: '',
    from_province: '', from_city: '', from: '', to_province: '', to_city: '', to: '',
    km: 0, exp_days: settings.tripDays || 0, act_days: 0, over_days: 0,
    lifted: 0, delivered: 0, lpg_diff: '', lpg_bill: 'absorbed', lpg_rent_mt: 0, lpg_rent_total: 0,
    billed: 0, peshgi: 0, status: 'Completed',
    toll: 0,
    driver_exp: 0,
    helper_exp: 0,
    overday_cost: 0, chalan: 0, chalan_resp: '', tyre: 0, loadunload: 0,
    weigh: 0, excise: 0, motorway: 0, grease: 0, air: 0,
    engine_oil_litres: 0, engine_oil_price: 0, engine_oil_cost: 0,
    other_exp: 0, other_notes: '',
    delay_reason: '', delay_notes: '',
    diesel_open: 0, diesel_close: 0, diesel_total: 0, diesel_consumed: 0, diesel_avg: '', diesel_cost: 0,
    notes: '',
  };
}

function tripToForm(t: Trip): TripForm {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, total_exp, net_pl, diesel_purchases, ...rest } = t;
  return rest;
}

export default function TripModal({ trip, onClose }: Props) {
  const { fleet, drivers, parties, settings, provinces, cities, sites, cityDistances, saveTrip } = useApp();
  const [form, setForm] = useState<TripForm>(trip ? tripToForm(trip) : emptyForm(settings));
  const [dieselRows, setDieselRows] = useState<DieselPurchase[]>(trip?.diesel_purchases || []);

  const set = useCallback(<K extends keyof TripForm>(k: K, v: TripForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v })), []);

  const fuelSuppliers = parties.filter(p => p.type === 'fuel');
  const clients = parties.filter(p => p.type === 'client');

  // Vehicle → driver auto-select
  const selectedFleet = fleet.find(f => f.reg === form.vehicle);
  const autoDriver = selectedFleet ? drivers.find(d => d.vehicle_id === selectedFleet.id) : undefined;
  const driverLocked = !!autoDriver;

  function handleVehicleChange(reg: string) {
    const fi = fleet.find(f => f.reg === reg);
    const ad = fi ? drivers.find(d => d.vehicle_id === fi.id) : undefined;
    setForm(prev => ({ ...prev, vehicle: reg, driver: ad?.id || '' }));
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
  }

  function handleFromCity(cityName: string) {
    setForm(prev => ({ ...prev, from_city: cityName, from: '' }));
    tryFillKm(cityName, form.to_city);
  }

  function handleToProvince(prov: string) {
    setForm(prev => ({ ...prev, to_province: prov, to_city: '', to: '' }));
  }

  function handleToCity(cityName: string) {
    setForm(prev => ({ ...prev, to_city: cityName, to: '' }));
    tryFillKm(form.from_city, cityName);
  }

  function calcOverDays(expDays: number, actDays: number) {
    const over = Math.max(0, actDays - expDays);
    const overCost = over > 0 ? (settings.driverDaily + settings.helperDaily) * over : 0;
    const dailyAllowance = (settings.driverDaily + settings.helperDaily) * actDays;
    setForm(prev => ({
      ...prev,
      exp_days: expDays, act_days: actDays, over_days: over,
      overday_cost: overCost || prev.overday_cost,
      driver_exp: dailyAllowance,
    }));
  }

  function calcLpgDiff(lifted: number, delivered: number) {
    const diff = delivered - lifted;
    const diffStr = diff ? (diff > 0 ? '+' + diff : String(diff)) : '';
    setForm(prev => {
      const rentTotal = (prev.lpg_rent_mt || 0) * (delivered / 1000);
      return { ...prev, lifted, delivered, lpg_diff: diffStr, lpg_rent_total: rentTotal };
    });
  }

  function setLpgRentMt(val: number) {
    setForm(prev => ({ ...prev, lpg_rent_mt: val, lpg_rent_total: val * ((prev.delivered || 0) / 1000) }));
  }

  function calcEngineOil(litres: number, price: number) {
    setForm(prev => ({ ...prev, engine_oil_litres: litres, engine_oil_price: price, engine_oil_cost: litres * price }));
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

  const expFields: (keyof TripForm)[] = ['toll', 'driver_exp', 'overday_cost', 'chalan', 'tyre', 'loadunload', 'weigh', 'excise', 'grease', 'engine_oil_cost', 'other_exp', 'diesel_cost'];
  const totalExp = expFields.reduce((s, f) => s + (Number(form[f]) || 0), 0);
  const pl = (form.lpg_rent_total || 0) - totalExp;

  async function handleSave() {
    const id = trip?.id || uid();
    await saveTrip({ ...form, id, total_exp: totalExp, net_pl: pl, diesel_purchases: dieselRows });
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
              <DateInput value={form.load_date} onChange={v => set('load_date', v)} />
            </div>
            <div className="form-group">
              <label>Off-load date</label>
              <DateInput value={form.offload_date} onChange={v => set('offload_date', v)} />
            </div>
            <div className="form-group">
              <label>Vehicle (reg no.)</label>
              <select value={form.vehicle} onChange={e => handleVehicleChange(e.target.value)}>
                <option value="">— select —</option>
                {fleet.map(f => <option key={f.id} value={f.reg}>{f.reg}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Driver{driverLocked ? ' (auto-assigned)' : ''}</label>
              <select value={form.driver} onChange={e => set('driver', e.target.value)} disabled={driverLocked}>
                <option value="">— select —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Client</label>
              <select value={form.client} onChange={e => set('client', e.target.value)}>
                <option value="">— select —</option>
                {clients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-section">Route</div>
            <div className="form-group">
              <label>From (Province)</label>
              <select value={form.from_province} onChange={e => handleFromProvince(e.target.value)}>
                <option value="">— select province —</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>From (City)</label>
              <select value={form.from_city} onChange={e => handleFromCity(e.target.value)} disabled={!form.from_province}>
                <option value="">— select city —</option>
                {cities.filter(c => provinces.find(p => p.name === form.from_province)?.id === c.province_id)
                  .map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>From (Site)</label>
              <select value={form.from} onChange={e => set('from', e.target.value)} disabled={!form.from_city}>
                <option value="">— select site —</option>
                {sites.filter(s => cities.find(c => c.name === form.from_city)?.id === s.city_id)
                  .map(s => <option key={s.id} value={s.name}>{s.name} <span>({s.type})</span></option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To (Province)</label>
              <select value={form.to_province} onChange={e => handleToProvince(e.target.value)}>
                <option value="">— select province —</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To (City)</label>
              <select value={form.to_city} onChange={e => handleToCity(e.target.value)} disabled={!form.to_province}>
                <option value="">— select city —</option>
                {cities.filter(c => provinces.find(p => p.name === form.to_province)?.id === c.province_id)
                  .map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To (Site)</label>
              <select value={form.to} onChange={e => set('to', e.target.value)} disabled={!form.to_city}>
                <option value="">— select site —</option>
                {sites.filter(s => cities.find(c => c.name === form.to_city)?.id === s.city_id)
                  .map(s => <option key={s.id} value={s.name}>{s.name} ({s.type})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Distance (km)</label><input type="number" value={form.km || ''} onChange={e => set('km', Number(e.target.value))} /></div>
            <div className="form-group"><label>Expected days</label><input type="number" value={form.exp_days || ''} onChange={e => calcOverDays(Number(e.target.value), form.act_days)} /></div>
            <div className="form-group"><label>Actual days</label><input type="number" value={form.act_days || ''} onChange={e => calcOverDays(form.exp_days, Number(e.target.value))} /></div>
            <div className="form-group"><label>Over days</label><input type="number" readOnly value={form.over_days || ''} style={{ color: 'var(--accent)' }} /></div>

            <div className="form-section">Trip expenses</div>
            <div className="form-group"><label>Toll / tolpalaza (Rs)</label><input type="number" value={form.toll || ''} onChange={e => set('toll', Number(e.target.value))} /></div>
            <div className="form-group">
              <label>Driver + Helper daily allowance (Rs)</label>
              <input readOnly value={form.driver_exp || ''} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} title={`Rate: Rs ${settings.driverDaily + settings.helperDaily}/day × ${form.act_days} days`} />
            </div>
            <div className="form-group"><label>Over-days extra cost (Rs)</label><input type="number" value={form.overday_cost || ''} onChange={e => set('overday_cost', Number(e.target.value))} /></div>
            <div className="form-group"><label>Motorway chalan (Rs)</label><input type="number" value={form.chalan || ''} onChange={e => set('chalan', Number(e.target.value))} /></div>
            <div className="form-group">
              <label>Chalan responsibility</label>
              <select value={form.chalan_resp} onChange={e => set('chalan_resp', e.target.value)}>
                <option value="">N/A</option>
                <option value="company">Company</option>
                <option value="driver">Deduct from driver</option>
              </select>
            </div>
            <div className="form-group"><label>Tyre bill (Rs)</label><input type="number" value={form.tyre || ''} onChange={e => set('tyre', Number(e.target.value))} /></div>
            <div className="form-group"><label>Load / unload (Rs)</label><input type="number" value={form.loadunload || ''} onChange={e => set('loadunload', Number(e.target.value))} /></div>
            <div className="form-group"><label>Weighbridge / manshana (Rs)</label><input type="number" value={form.weigh || ''} onChange={e => set('weigh', Number(e.target.value))} /></div>
            <div className="form-group"><label>Excise + PP (Rs)</label><input type="number" value={form.excise || ''} onChange={e => set('excise', Number(e.target.value))} /></div>
            <div className="form-group"><label>Greasing / service (Rs)</label><input type="number" value={form.grease || ''} onChange={e => set('grease', Number(e.target.value))} /></div>
            <div className="form-group full">
              <label>Engine oil</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" style={{ flex: 1 }} placeholder="Litres" value={form.engine_oil_litres || ''} onChange={e => calcEngineOil(Number(e.target.value), form.engine_oil_price)} />
                <input type="number" style={{ flex: 1 }} placeholder="Price/ltr (Rs)" value={form.engine_oil_price || ''} onChange={e => calcEngineOil(form.engine_oil_litres, Number(e.target.value))} />
                <input readOnly style={{ flex: 1, fontFamily: 'var(--mono)' }} placeholder="Cost (Rs)" value={form.engine_oil_cost || ''} />
              </div>
            </div>
            <div className="form-group"><label>Other expenses (Rs)</label><input type="number" value={form.other_exp || ''} onChange={e => set('other_exp', Number(e.target.value))} /></div>
            <div className="form-group full"><label>Other expense notes</label><input value={form.other_notes} onChange={e => set('other_notes', e.target.value)} placeholder="Describe any other expenses" /></div>

            <div className="form-section">Over-days reason</div>
            <div className="form-group">
              <label>Reason for delay</label>
              <select value={form.delay_reason} onChange={e => set('delay_reason', e.target.value)}>
                <option value="">None</option>
                <option>Traffic / road conditions</option>
                <option>Loading delay</option>
                <option>Unloading delay</option>
                <option>Vehicle breakdown</option>
                <option>Weather</option>
                <option>Administrative / documentation</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group"><label>Delay notes</label><input value={form.delay_notes} onChange={e => set('delay_notes', e.target.value)} /></div>

            <div className="form-section">Diesel log</div>
            <div className="form-group"><label>Opening diesel stock (ltr)</label><input type="number" value={form.diesel_open || ''} onChange={e => recalcDiesel(Number(e.target.value), form.diesel_close)} /></div>
            <div className="form-group"><label>Closing diesel stock (ltr)</label><input type="number" value={form.diesel_close || ''} onChange={e => recalcDiesel(form.diesel_open, Number(e.target.value))} /></div>
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
            <div className="form-group">
              <label>Gain/loss billed to client?</label>
              <select value={form.lpg_bill} onChange={e => set('lpg_bill', e.target.value)}>
                <option value="absorbed">Absorbed by us</option>
                <option value="billed">Billed to client</option>
              </select>
            </div>
            <div className="form-group"><label>Rent/MT (Rs)</label><input type="number" value={form.lpg_rent_mt || ''} onChange={e => setLpgRentMt(Number(e.target.value))} /></div>
            <div className="form-group"><label>Total rent (Rs)</label><input readOnly value={form.lpg_rent_total ? form.lpg_rent_total.toFixed(2) : ''} style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }} /></div>

            <div className="form-section">Trip P&amp;L summary</div>
            <div className="form-group full">
              <div className="cost-card">
                <div className="cost-row"><span className="cost-label">LPG rent income</span><span className="cost-val">{rs(form.lpg_rent_total)}</span></div>
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
