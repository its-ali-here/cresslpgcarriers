'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/utils';
import { SITE_TYPES } from '@/lib/types';
import type { SiteType } from '@/lib/types';

type Tab = 'locations' | 'distances';

// ── inline edit state helpers ────────────────────────────────────────────────
interface InlineEdit { id: string; value: string; extra?: string; }

export default function Destinations() {
  const {
    provinces, cities, sites, cityDistances,
    saveProvince, deleteProvince,
    saveCity, deleteCity,
    saveSite, deleteSite,
    saveCityDistance, deleteCityDistance,
  } = useApp();

  const [tab, setTab] = useState<Tab>('locations');

  // expanded state for provinces and cities
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // inline add/edit state
  const [addingProvince, setAddingProvince] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState('');

  const [addingCityFor, setAddingCityFor] = useState<string | null>(null); // province_id
  const [newCityName, setNewCityName] = useState('');

  const [addingSiteFor, setAddingSiteFor] = useState<string | null>(null); // city_id
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState<SiteType>('Plant');

  const [editProvince, setEditProvince] = useState<InlineEdit | null>(null);
  const [editCity, setEditCity] = useState<InlineEdit | null>(null);
  const [editSite, setEditSite] = useState<InlineEdit | null>(null);

  // distances state
  const [addingDist, setAddingDist] = useState(false);
  const [distFrom, setDistFrom] = useState('');
  const [distTo, setDistTo] = useState('');
  const [distKm, setDistKm] = useState('');
  const [editDist, setEditDist] = useState<{ id: string; km: string } | null>(null);

  function toggleProvince(id: string) {
    setExpandedProvinces(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCity(id: string) {
    setExpandedCities(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Province actions ──────────────────────────────────────────────────────
  async function handleAddProvince() {
    const name = newProvinceName.trim();
    if (!name) return;
    await saveProvince({ id: uid(), name });
    setNewProvinceName('');
    setAddingProvince(false);
  }

  async function handleEditProvince() {
    if (!editProvince || !editProvince.value.trim()) return;
    await saveProvince({ id: editProvince.id, name: editProvince.value.trim() });
    setEditProvince(null);
  }

  async function handleDeleteProvince(id: string) {
    if (!confirm('Delete this province and all its cities and sites?')) return;
    await deleteProvince(id);
    setExpandedProvinces(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  // ── City actions ──────────────────────────────────────────────────────────
  async function handleAddCity(provinceId: string) {
    const name = newCityName.trim();
    if (!name) return;
    await saveCity({ id: uid(), province_id: provinceId, name });
    setNewCityName('');
    setAddingCityFor(null);
    setExpandedProvinces(prev => new Set([...prev, provinceId]));
  }

  async function handleEditCity() {
    if (!editCity || !editCity.value.trim()) return;
    const city = cities.find(c => c.id === editCity.id)!;
    await saveCity({ ...city, name: editCity.value.trim() });
    setEditCity(null);
  }

  async function handleDeleteCity(id: string) {
    if (!confirm('Delete this city and all its sites?')) return;
    await deleteCity(id);
    setExpandedCities(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  // ── Site actions ──────────────────────────────────────────────────────────
  async function handleAddSite(cityId: string) {
    const name = newSiteName.trim();
    if (!name) return;
    await saveSite({ id: uid(), city_id: cityId, name, type: newSiteType });
    setNewSiteName('');
    setNewSiteType('Plant');
    setAddingSiteFor(null);
    setExpandedCities(prev => new Set([...prev, cityId]));
  }

  async function handleEditSite() {
    if (!editSite || !editSite.value.trim()) return;
    const site = sites.find(s => s.id === editSite.id)!;
    await saveSite({ ...site, name: editSite.value.trim(), type: (editSite.extra || site.type) as SiteType });
    setEditSite(null);
  }

  async function handleDeleteSite(id: string) {
    if (!confirm('Delete this site?')) return;
    await deleteSite(id);
  }

  // ── Distance actions ──────────────────────────────────────────────────────
  async function handleAddDist() {
    const km = Number(distKm);
    if (!distFrom || !distTo || !km || distFrom === distTo) return;
    await saveCityDistance({ id: uid(), from_city_id: distFrom, to_city_id: distTo, km });
    setDistFrom(''); setDistTo(''); setDistKm(''); setAddingDist(false);
  }

  async function handleEditDist(id: string) {
    if (!editDist) return;
    const d = cityDistances.find(x => x.id === id)!;
    await saveCityDistance({ ...d, km: Number(editDist.km) });
    setEditDist(null);
  }

  async function handleDeleteDist(id: string) {
    if (!confirm('Delete this distance?')) return;
    await deleteCityDistance(id);
  }

  const cityName = (id: string) => cities.find(c => c.id === id)?.name || id;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Destinations</div></div>
        <div className="header-actions">
          {tab === 'locations' && (
            <button className="btn btn-primary" onClick={() => { setAddingProvince(true); setNewProvinceName(''); }}>
              + Add province
            </button>
          )}
          {tab === 'distances' && (
            <button className="btn btn-primary" onClick={() => setAddingDist(true)}>
              + Add distance
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        {(['locations', 'distances'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text2)',
              marginBottom: -1,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── LOCATIONS TAB ───────────────────────────────────────────────────── */}
      {tab === 'locations' && (
        <div>
          {/* Add province inline row */}
          {addingProvince && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6 }}>
              <input
                autoFocus
                value={newProvinceName}
                onChange={e => setNewProvinceName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddProvince(); if (e.key === 'Escape') setAddingProvince(false); }}
                placeholder="Province name"
                style={{ flex: 1 }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddProvince}>Save</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setAddingProvince(false)}>Cancel</button>
            </div>
          )}

          {provinces.length === 0 && !addingProvince && (
            <div className="empty"><div className="empty-icon">📍</div>No provinces yet. Add one to get started.</div>
          )}

          {provinces.map(province => {
            const provinceCities = cities.filter(c => c.province_id === province.id);
            const isExpanded = expandedProvinces.has(province.id);

            return (
              <div key={province.id} style={{ marginBottom: 8 }}>
                {/* Province row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 6, cursor: 'pointer' }} onClick={() => toggleProvince(province.id)}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', userSelect: 'none' }}>{isExpanded ? '▼' : '▶'}</span>
                  {editProvince?.id === province.id ? (
                    <input
                      autoFocus
                      value={editProvince.value}
                      onChange={e => setEditProvince({ ...editProvince, value: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditProvince(); if (e.key === 'Escape') setEditProvince(null); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <span style={{ flex: 1, fontWeight: 600 }}>{province.name}</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{provinceCities.length} {provinceCities.length === 1 ? 'city' : 'cities'}</span>
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {editProvince?.id === province.id ? (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={handleEditProvince}>Save</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditProvince(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setAddingCityFor(province.id); setNewCityName(''); setExpandedProvinces(prev => new Set([...prev, province.id])); }}>+ City</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditProvince({ id: province.id, value: province.name })}>✏</button>
                        <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteProvince(province.id)}>✕</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Cities (expanded) */}
                {isExpanded && (
                  <div style={{ marginLeft: 24, marginTop: 4 }}>
                    {/* Add city inline */}
                    {addingCityFor === province.id && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                        <input
                          autoFocus
                          value={newCityName}
                          onChange={e => setNewCityName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddCity(province.id); if (e.key === 'Escape') setAddingCityFor(null); }}
                          placeholder="City name"
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => handleAddCity(province.id)}>Save</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setAddingCityFor(null)}>Cancel</button>
                      </div>
                    )}

                    {provinceCities.length === 0 && addingCityFor !== province.id && (
                      <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: 12 }}>No cities — click + City to add one</div>
                    )}

                    {provinceCities.map(city => {
                      const citySites = sites.filter(s => s.city_id === city.id);
                      const isCityExpanded = expandedCities.has(city.id);

                      return (
                        <div key={city.id} style={{ marginBottom: 4 }}>
                          {/* City row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} onClick={() => toggleCity(city.id)}>
                            <span style={{ fontSize: 11, color: 'var(--text3)', userSelect: 'none' }}>{isCityExpanded ? '▼' : '▶'}</span>
                            {editCity?.id === city.id ? (
                              <input
                                autoFocus
                                value={editCity.value}
                                onChange={e => setEditCity({ ...editCity, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleEditCity(); if (e.key === 'Escape') setEditCity(null); }}
                                onClick={e => e.stopPropagation()}
                                style={{ flex: 1 }}
                              />
                            ) : (
                              <span style={{ flex: 1, fontWeight: 500 }}>{city.name}</span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{citySites.length} {citySites.length === 1 ? 'site' : 'sites'}</span>
                            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                              {editCity?.id === city.id ? (
                                <>
                                  <button className="btn btn-sm btn-primary" onClick={handleEditCity}>Save</button>
                                  <button className="btn btn-sm btn-ghost" onClick={() => setEditCity(null)}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-ghost btn-sm" onClick={() => { setAddingSiteFor(city.id); setNewSiteName(''); setNewSiteType('Plant'); setExpandedCities(prev => new Set([...prev, city.id])); }}>+ Site</button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setEditCity({ id: city.id, value: city.name })}>✏</button>
                                  <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteCity(city.id)}>✕</button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Sites (expanded) */}
                          {isCityExpanded && (
                            <div style={{ marginLeft: 24, marginTop: 4 }}>
                              {/* Add site inline */}
                              {addingSiteFor === city.id && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: '8px 12px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 6 }}>
                                  <input
                                    autoFocus
                                    value={newSiteName}
                                    onChange={e => setNewSiteName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddSite(city.id); if (e.key === 'Escape') setAddingSiteFor(null); }}
                                    placeholder="Site name"
                                    style={{ flex: 1 }}
                                  />
                                  <select value={newSiteType} onChange={e => setNewSiteType(e.target.value as SiteType)} style={{ width: 110 }}>
                                    {SITE_TYPES.map(t => <option key={t}>{t}</option>)}
                                  </select>
                                  <button className="btn btn-sm btn-primary" onClick={() => handleAddSite(city.id)}>Save</button>
                                  <button className="btn btn-sm btn-ghost" onClick={() => setAddingSiteFor(null)}>Cancel</button>
                                </div>
                              )}

                              {citySites.length === 0 && addingSiteFor !== city.id && (
                                <div style={{ padding: '6px 12px', color: 'var(--text3)', fontSize: 12 }}>No sites — click + Site to add one</div>
                              )}

                              {citySites.map(site => (
                                <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                                  {editSite?.id === site.id ? (
                                    <>
                                      <input
                                        autoFocus
                                        value={editSite.value}
                                        onChange={e => setEditSite({ ...editSite, value: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleEditSite(); if (e.key === 'Escape') setEditSite(null); }}
                                        style={{ flex: 1 }}
                                      />
                                      <select value={editSite.extra || site.type} onChange={e => setEditSite({ ...editSite, extra: e.target.value })} style={{ width: 110 }}>
                                        {SITE_TYPES.map(t => <option key={t}>{t}</option>)}
                                      </select>
                                      <button className="btn btn-sm btn-primary" onClick={handleEditSite}>Save</button>
                                      <button className="btn btn-sm btn-ghost" onClick={() => setEditSite(null)}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ flex: 1, fontSize: 13 }}>{site.name}</span>
                                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{site.type}</span>
                                      <button className="btn btn-ghost btn-sm" onClick={() => setEditSite({ id: site.id, value: site.name, extra: site.type })}>✏</button>
                                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteSite(site.id)}>✕</button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DISTANCES TAB ───────────────────────────────────────────────────── */}
      {tab === 'distances' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>From city</th><th>To city</th><th>Distance (km)</th><th></th></tr>
            </thead>
            <tbody>
              {addingDist && (
                <tr>
                  <td>
                    <select value={distFrom} onChange={e => setDistFrom(e.target.value)} style={{ width: '100%' }}>
                      <option value="">— select —</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={distTo} onChange={e => setDistTo(e.target.value)} style={{ width: '100%' }}>
                      <option value="">— select —</option>
                      {cities.filter(c => c.id !== distFrom).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={distKm} onChange={e => setDistKm(e.target.value)} placeholder="km" style={{ width: '100%' }} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-primary" onClick={handleAddDist}>Save</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setAddingDist(false)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
              {cityDistances.length === 0 && !addingDist ? (
                <tr><td colSpan={4}><div className="empty"><div className="empty-icon">🗺</div>No distances recorded yet.</div></td></tr>
              ) : cityDistances.map(d => (
                <tr key={d.id}>
                  <td>{cityName(d.from_city_id)}</td>
                  <td>{cityName(d.to_city_id)}</td>
                  <td>
                    {editDist?.id === d.id ? (
                      <input type="number" value={editDist.km} onChange={e => setEditDist({ ...editDist, km: e.target.value })} style={{ width: 100 }} />
                    ) : (
                      <span className="mono">{d.km.toLocaleString()} km</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {editDist?.id === d.id ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => handleEditDist(d.id)}>Save</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setEditDist(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditDist({ id: d.id, km: String(d.km) })}>✏</button>
                          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteDist(d.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
