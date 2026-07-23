'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { uid } from '@/lib/utils';
import { SITE_TYPES } from '@/lib/types';
import type { SiteType } from '@/lib/types';

// ── inline edit state helpers ────────────────────────────────────────────────
interface InlineEdit { id: string; value: string; extra?: string; }

export default function Destinations() {
  const {
    provinces, districts, sites,
    saveProvince, deleteProvince,
    saveDistrict, deleteDistrict,
    saveSite, deleteSite,
  } = useApp();

  const { role } = useUser();
  const isAdmin = role === 'admin';

  // expanded state for provinces and districts
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  // inline add/edit state
  const [addingProvince, setAddingProvince] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState('');

  const [addingDistrictFor, setAddingDistrictFor] = useState<string | null>(null); // province_id
  const [newDistrictName, setNewDistrictName] = useState('');

  const [addingSiteFor, setAddingSiteFor] = useState<string | null>(null); // city_id
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState<SiteType>('Plant');

  const [editProvince, setEditProvince] = useState<InlineEdit | null>(null);
  const [editDistrict, setEditDistrict] = useState<InlineEdit | null>(null);
  const [editSite, setEditSite] = useState<InlineEdit | null>(null);

  function toggleProvince(id: string) {
    setExpandedProvinces(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDistrict(id: string) {
    setExpandedDistricts(prev => {
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
    if (!confirm('Delete this province and all its districts and sites?')) return;
    await deleteProvince(id);
    setExpandedProvinces(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  // ── District actions ──────────────────────────────────────────────────────
  async function handleAddDistrict(provinceId: string) {
    const name = newDistrictName.trim();
    if (!name) return;
    await saveDistrict({ id: uid(), province_id: provinceId, name });
    setNewDistrictName('');
    setAddingDistrictFor(null);
    setExpandedProvinces(prev => new Set([...prev, provinceId]));
  }

  async function handleEditDistrict() {
    if (!editDistrict || !editDistrict.value.trim()) return;
    const district = districts.find(d => d.id === editDistrict.id)!;
    await saveDistrict({ ...district, name: editDistrict.value.trim() });
    setEditDistrict(null);
  }

  async function handleDeleteDistrict(id: string) {
    if (!confirm('Delete this district and all its sites?')) return;
    await deleteDistrict(id);
    setExpandedDistricts(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  // ── Site actions ──────────────────────────────────────────────────────────
  async function handleAddSite(districtId: string) {
    const name = newSiteName.trim();
    if (!name) return;
    await saveSite({ id: uid(), city_id: districtId, name, type: newSiteType });
    setNewSiteName('');
    setNewSiteType('Plant');
    setAddingSiteFor(null);
    setExpandedDistricts(prev => new Set([...prev, districtId]));
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Destinations</div></div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setAddingProvince(true); setNewProvinceName(''); }}>
              + Add province
            </button>
          )}
        </div>
      </div>

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
            const provinceDistricts = districts.filter(d => d.province_id === province.id);
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
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{provinceDistricts.length} {provinceDistricts.length === 1 ? 'district' : 'districts'}</span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      {editProvince?.id === province.id ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={handleEditProvince}>Save</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setEditProvince(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setAddingDistrictFor(province.id); setNewDistrictName(''); setExpandedProvinces(prev => new Set([...prev, province.id])); }}>+ District</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditProvince({ id: province.id, value: province.name })}>✏</button>
                          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteProvince(province.id)}>✕</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Districts (expanded) */}
                {isExpanded && (
                  <div style={{ marginLeft: 24, marginTop: 4 }}>
                    {/* Add district inline */}
                    {addingDistrictFor === province.id && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                        <input
                          autoFocus
                          value={newDistrictName}
                          onChange={e => setNewDistrictName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddDistrict(province.id); if (e.key === 'Escape') setAddingDistrictFor(null); }}
                          placeholder="District name"
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => handleAddDistrict(province.id)}>Save</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setAddingDistrictFor(null)}>Cancel</button>
                      </div>
                    )}

                    {provinceDistricts.length === 0 && addingDistrictFor !== province.id && (
                      <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: 12 }}>No districts — click + District to add one</div>
                    )}

                    {provinceDistricts.map(district => {
                      const districtSites = sites.filter(s => s.city_id === district.id);
                      const isDistrictExpanded = expandedDistricts.has(district.id);

                      return (
                        <div key={district.id} style={{ marginBottom: 4 }}>
                          {/* District row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} onClick={() => toggleDistrict(district.id)}>
                            <span style={{ fontSize: 11, color: 'var(--text3)', userSelect: 'none' }}>{isDistrictExpanded ? '▼' : '▶'}</span>
                            {editDistrict?.id === district.id ? (
                              <input
                                autoFocus
                                value={editDistrict.value}
                                onChange={e => setEditDistrict({ ...editDistrict, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleEditDistrict(); if (e.key === 'Escape') setEditDistrict(null); }}
                                onClick={e => e.stopPropagation()}
                                style={{ flex: 1 }}
                              />
                            ) : (
                              <span style={{ flex: 1, fontWeight: 500 }}>{district.name}</span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{districtSites.length} {districtSites.length === 1 ? 'site' : 'sites'}</span>
                            {isAdmin && (
                              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                {editDistrict?.id === district.id ? (
                                  <>
                                    <button className="btn btn-sm btn-primary" onClick={handleEditDistrict}>Save</button>
                                    <button className="btn btn-sm btn-ghost" onClick={() => setEditDistrict(null)}>Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingSiteFor(district.id); setNewSiteName(''); setNewSiteType('Plant'); setExpandedDistricts(prev => new Set([...prev, district.id])); }}>+ Site</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditDistrict({ id: district.id, value: district.name })}>✏</button>
                                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteDistrict(district.id)}>✕</button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sites (expanded) */}
                          {isDistrictExpanded && (
                            <div style={{ marginLeft: 24, marginTop: 4 }}>
                              {/* Add site inline */}
                              {addingSiteFor === district.id && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: '8px 12px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 6 }}>
                                  <input
                                    autoFocus
                                    value={newSiteName}
                                    onChange={e => setNewSiteName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddSite(district.id); if (e.key === 'Escape') setAddingSiteFor(null); }}
                                    placeholder="Site name"
                                    style={{ flex: 1 }}
                                  />
                                  <select value={newSiteType} onChange={e => setNewSiteType(e.target.value as SiteType)} style={{ width: 110 }}>
                                    {SITE_TYPES.map(t => <option key={t}>{t}</option>)}
                                  </select>
                                  <button className="btn btn-sm btn-primary" onClick={() => handleAddSite(district.id)}>Save</button>
                                  <button className="btn btn-sm btn-ghost" onClick={() => setAddingSiteFor(null)}>Cancel</button>
                                </div>
                              )}

                              {districtSites.length === 0 && addingSiteFor !== district.id && (
                                <div style={{ padding: '6px 12px', color: 'var(--text3)', fontSize: 12 }}>No sites — click + Site to add one</div>
                              )}

                              {districtSites.map(site => (
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
                                      {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditSite({ id: site.id, value: site.name, extra: site.type })}>✏</button>}
                                      {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteSite(site.id)}>✕</button>}
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
    </div>
  );
}
