'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  AppDB, Trip, Expense,
  FleetItem, Driver, Settings,
  Province, City, Site, CityDistance, ExpenseCategory, DieselSupplier,
} from '@/lib/types';
import * as db from '@/lib/db';

interface AppContextValue extends AppDB {
  loading: boolean;
  // Trips
  saveTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  approveTrip: (id: string) => Promise<void>;
  approvePendingEdit: (id: string) => Promise<void>;
  rejectPendingEdit: (id: string) => Promise<void>;
  // Expenses
  saveExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Fleet
  saveFleet: (item: FleetItem) => Promise<void>;
  deleteFleet: (id: string) => Promise<void>;
  approveFleet: (id: string) => Promise<void>;
  approvePendingFleetEdit: (id: string) => Promise<void>;
  rejectPendingFleetEdit: (id: string) => Promise<void>;
  // Drivers
  saveDriver: (driver: Driver) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  approveDriver: (id: string) => Promise<void>;
  approvePendingDriverEdit: (id: string) => Promise<void>;
  rejectPendingDriverEdit: (id: string) => Promise<void>;
  // Settings
  updateSettings: (s: Settings) => Promise<void>;
  // Provinces
  saveProvince: (p: Province) => Promise<void>;
  deleteProvince: (id: string) => Promise<void>;
  // Cities
  saveCity: (c: City) => Promise<void>;
  deleteCity: (id: string) => Promise<void>;
  // Sites
  saveSite: (s: Site) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  // City distances
  saveCityDistance: (d: CityDistance) => Promise<void>;
  deleteCityDistance: (id: string) => Promise<void>;
  // Expense categories
  saveExpenseCategory: (cat: ExpenseCategory) => Promise<void>;
  deleteExpenseCategory: (id: string) => Promise<void>;
  // Diesel suppliers
  saveDieselSupplier: (s: DieselSupplier) => Promise<void>;
  deleteDieselSupplier: (id: string) => Promise<void>;
}

function numberingDate(t: Trip): string {
  return t.trip_start_date || t.load_date;
}

function assignNos(trips: Trip[]): Trip[] {
  const withDate = [...trips].filter(t => numberingDate(t))
    .sort((a, b) => numberingDate(a).localeCompare(numberingDate(b)) || a.id.localeCompare(b.id));
  const yearSeq: Record<string, number> = {};
  const numbered = withDate.map(t => {
    const year = numberingDate(t).slice(0, 4);
    yearSeq[year] = (yearSeq[year] ?? 0) + 1;
    return { ...t, no: `${year}-${String(yearSeq[year]).padStart(3, '0')}` };
  });
  return [...numbered, ...trips.filter(t => !numberingDate(t))];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppDB>({
    trips: [], expenses: [],
    fleet: [], drivers: [],
    settings: { company: 'CRESS LPG CARRIERS', yard: '', driverDaily: 0, helperDaily: 0, tripDays: 0, dieselBench: 2.6 },
    provinces: [], cities: [], sites: [], cityDistances: [], expenseCategories: [], dieselSuppliers: [],
  });

  useEffect(() => {
    db.fetchAll()
      .then(data => { setState(data); setLoading(false); })
      .catch(err => { console.error('Failed to load data:', err); setLoading(false); });
  }, []);

  const set = <K extends keyof AppDB>(key: K, val: AppDB[K]) =>
    setState(prev => ({ ...prev, [key]: val }));

  // TRIPS
  const saveTrip = useCallback(async (trip: Trip) => {
    await db.upsertTrip(trip);
    await db.syncDieselPurchases(trip.id, trip.diesel_purchases || []);
    const current = state.trips;
    const next = current.some(t => t.id === trip.id)
      ? current.map(t => t.id === trip.id ? trip : t)
      : [...current, trip];
    const renumbered = assignNos(next);
    const changed = renumbered.filter(r => current.find(t => t.id === r.id)?.no !== r.no);
    await db.batchUpdateTripNos(changed.map(t => ({ id: t.id, no: t.no })));
    setState(prev => ({ ...prev, trips: renumbered }));
  }, [state.trips]);

  const deleteTrip = useCallback(async (id: string) => {
    await db.deleteTrip(id);
    const next = state.trips.filter(t => t.id !== id);
    const renumbered = assignNos(next);
    const changed = renumbered.filter(r => state.trips.find(t => t.id === r.id)?.no !== r.no);
    await db.batchUpdateTripNos(changed.map(t => ({ id: t.id, no: t.no })));
    setState(prev => ({ ...prev, trips: renumbered }));
  }, [state.trips]);

  const approveTrip = useCallback(async (id: string) => {
    await db.approveTrip(id);
    setState(prev => ({ ...prev, trips: prev.trips.map(t => t.id === id ? { ...t, approved: true } : t) }));
  }, []);

  const approvePendingEdit = useCallback(async (id: string) => {
    const trip = state.trips.find(t => t.id === id);
    if (!trip?.pending_edit) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __edited_by, __edited_at, ...editData } = trip.pending_edit as Record<string, unknown>;
    const merged: Trip = { ...trip, ...(editData as Partial<Trip>), pending_edit: null };
    await db.upsertTrip(merged);
    await db.syncDieselPurchases(merged.id, merged.diesel_purchases || []);
    const next = state.trips.map(t => t.id === id ? merged : t);
    const renumbered = assignNos(next);
    const changed = renumbered.filter(r => state.trips.find(t => t.id === r.id)?.no !== r.no);
    if (changed.length) await db.batchUpdateTripNos(changed.map(t => ({ id: t.id, no: t.no })));
    setState(prev => ({ ...prev, trips: renumbered }));
  }, [state.trips]);

  const rejectPendingEdit = useCallback(async (id: string) => {
    const trip = state.trips.find(t => t.id === id);
    if (!trip) return;
    const updated: Trip = { ...trip, pending_edit: null };
    await db.upsertTrip(updated);
    setState(prev => ({ ...prev, trips: prev.trips.map(t => t.id === id ? updated : t) }));
  }, [state.trips]);

  // EXPENSES
  const saveExpense = useCallback(async (expense: Expense) => {
    await db.upsertExpense(expense);
    setState(prev => {
      const idx = prev.expenses.findIndex(e => e.id === expense.id);
      const expenses = idx >= 0 ? prev.expenses.map(e => e.id === expense.id ? expense : e) : [...prev.expenses, expense];
      return { ...prev, expenses };
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await db.deleteExpense(id);
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  // FLEET
  const saveFleet = useCallback(async (item: FleetItem) => {
    await db.upsertFleet(item);
    setState(prev => {
      const idx = prev.fleet.findIndex(f => f.id === item.id);
      const fleet = idx >= 0 ? prev.fleet.map(f => f.id === item.id ? item : f) : [...prev.fleet, item];
      return { ...prev, fleet };
    });
  }, []);

  const deleteFleet = useCallback(async (id: string) => {
    await db.deleteFleet(id);
    setState(prev => ({ ...prev, fleet: prev.fleet.filter(f => f.id !== id) }));
  }, []);

  const approveFleet = useCallback(async (id: string) => {
    await db.approveFleet(id);
    setState(prev => ({ ...prev, fleet: prev.fleet.map(f => f.id === id ? { ...f, approved: true } : f) }));
  }, []);

  const approvePendingFleetEdit = useCallback(async (id: string) => {
    const item = state.fleet.find(f => f.id === id);
    if (!item?.pending_edit) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __edited_by, __edited_at, ...editData } = item.pending_edit as Record<string, unknown>;
    const merged: FleetItem = { ...item, ...(editData as Partial<FleetItem>), pending_edit: null };
    await db.upsertFleet(merged);
    setState(prev => ({ ...prev, fleet: prev.fleet.map(f => f.id === id ? merged : f) }));
  }, [state.fleet]);

  const rejectPendingFleetEdit = useCallback(async (id: string) => {
    const item = state.fleet.find(f => f.id === id);
    if (!item) return;
    const updated: FleetItem = { ...item, pending_edit: null };
    await db.upsertFleet(updated);
    setState(prev => ({ ...prev, fleet: prev.fleet.map(f => f.id === id ? updated : f) }));
  }, [state.fleet]);

  // DRIVERS
  const saveDriver = useCallback(async (driver: Driver) => {
    await db.upsertDriver(driver);
    setState(prev => {
      const idx = prev.drivers.findIndex(d => d.id === driver.id);
      const drivers = idx >= 0 ? prev.drivers.map(d => d.id === driver.id ? driver : d) : [...prev.drivers, driver];
      return { ...prev, drivers };
    });
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    await db.deleteDriver(id);
    setState(prev => ({ ...prev, drivers: prev.drivers.filter(d => d.id !== id) }));
  }, []);

  const approveDriver = useCallback(async (id: string) => {
    await db.approveDriver(id);
    setState(prev => ({ ...prev, drivers: prev.drivers.map(d => d.id === id ? { ...d, approved: true } : d) }));
  }, []);

  const approvePendingDriverEdit = useCallback(async (id: string) => {
    const item = state.drivers.find(d => d.id === id);
    if (!item?.pending_edit) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __edited_by, __edited_at, ...editData } = item.pending_edit as Record<string, unknown>;
    const merged: Driver = { ...item, ...(editData as Partial<Driver>), pending_edit: null };
    await db.upsertDriver(merged);
    setState(prev => ({ ...prev, drivers: prev.drivers.map(d => d.id === id ? merged : d) }));
  }, [state.drivers]);

  const rejectPendingDriverEdit = useCallback(async (id: string) => {
    const item = state.drivers.find(d => d.id === id);
    if (!item) return;
    const updated: Driver = { ...item, pending_edit: null };
    await db.upsertDriver(updated);
    setState(prev => ({ ...prev, drivers: prev.drivers.map(d => d.id === id ? updated : d) }));
  }, [state.drivers]);

  // SETTINGS
  const updateSettings = useCallback(async (s: Settings) => {
    await db.saveSettings(s);
    set('settings', s);
  }, []);

  // PROVINCES
  const saveProvince = useCallback(async (p: Province) => {
    await db.upsertProvince(p);
    setState(prev => {
      const idx = prev.provinces.findIndex(x => x.id === p.id);
      const provinces = idx >= 0 ? prev.provinces.map(x => x.id === p.id ? p : x) : [...prev.provinces, p];
      return { ...prev, provinces };
    });
  }, []);

  const deleteProvince = useCallback(async (id: string) => {
    await db.deleteProvince(id);
    setState(prev => ({
      ...prev,
      provinces: prev.provinces.filter(p => p.id !== id),
      cities: prev.cities.filter(c => c.province_id !== id),
      sites: prev.sites.filter(s => !prev.cities.filter(c => c.province_id === id).map(c => c.id).includes(s.city_id)),
    }));
  }, []);

  // CITIES
  const saveCity = useCallback(async (c: City) => {
    await db.upsertCity(c);
    setState(prev => {
      const idx = prev.cities.findIndex(x => x.id === c.id);
      const cities = idx >= 0 ? prev.cities.map(x => x.id === c.id ? c : x) : [...prev.cities, c];
      return { ...prev, cities };
    });
  }, []);

  const deleteCity = useCallback(async (id: string) => {
    await db.deleteCity(id);
    setState(prev => ({
      ...prev,
      cities: prev.cities.filter(c => c.id !== id),
      sites: prev.sites.filter(s => s.city_id !== id),
      cityDistances: prev.cityDistances.filter(d => d.from_city_id !== id && d.to_city_id !== id),
    }));
  }, []);

  // SITES
  const saveSite = useCallback(async (s: Site) => {
    await db.upsertSite(s);
    setState(prev => {
      const idx = prev.sites.findIndex(x => x.id === s.id);
      const sites = idx >= 0 ? prev.sites.map(x => x.id === s.id ? s : x) : [...prev.sites, s];
      return { ...prev, sites };
    });
  }, []);

  const deleteSite = useCallback(async (id: string) => {
    await db.deleteSite(id);
    setState(prev => ({ ...prev, sites: prev.sites.filter(s => s.id !== id) }));
  }, []);

  // CITY DISTANCES
  const saveCityDistance = useCallback(async (d: CityDistance) => {
    await db.upsertCityDistance(d);
    setState(prev => {
      const idx = prev.cityDistances.findIndex(x => x.id === d.id);
      const cityDistances = idx >= 0 ? prev.cityDistances.map(x => x.id === d.id ? d : x) : [...prev.cityDistances, d];
      return { ...prev, cityDistances };
    });
  }, []);

  const deleteCityDistance = useCallback(async (id: string) => {
    await db.deleteCityDistance(id);
    setState(prev => ({ ...prev, cityDistances: prev.cityDistances.filter(d => d.id !== id) }));
  }, []);

  // EXPENSE CATEGORIES
  const saveExpenseCategory = useCallback(async (cat: ExpenseCategory) => {
    await db.upsertExpenseCategory(cat);
    setState(prev => {
      const idx = prev.expenseCategories.findIndex(x => x.id === cat.id);
      const expenseCategories = idx >= 0 ? prev.expenseCategories.map(x => x.id === cat.id ? cat : x) : [...prev.expenseCategories, cat];
      return { ...prev, expenseCategories };
    });
  }, []);

  const deleteExpenseCategory = useCallback(async (id: string) => {
    await db.deleteExpenseCategory(id);
    setState(prev => ({ ...prev, expenseCategories: prev.expenseCategories.filter(c => c.id !== id) }));
  }, []);

  // DIESEL SUPPLIERS
  const saveDieselSupplier = useCallback(async (s: DieselSupplier) => {
    await db.upsertDieselSupplier(s);
    setState(prev => {
      const idx = prev.dieselSuppliers.findIndex(x => x.id === s.id);
      const dieselSuppliers = idx >= 0 ? prev.dieselSuppliers.map(x => x.id === s.id ? s : x) : [...prev.dieselSuppliers, s];
      return { ...prev, dieselSuppliers };
    });
  }, []);

  const deleteDieselSupplier = useCallback(async (id: string) => {
    await db.deleteDieselSupplier(id);
    setState(prev => ({ ...prev, dieselSuppliers: prev.dieselSuppliers.filter(s => s.id !== id) }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, loading,
      saveTrip, deleteTrip, approveTrip, approvePendingEdit, rejectPendingEdit,
      saveExpense, deleteExpense,
      saveFleet, deleteFleet, approveFleet, approvePendingFleetEdit, rejectPendingFleetEdit,
      saveDriver, deleteDriver, approveDriver, approvePendingDriverEdit, rejectPendingDriverEdit,
      updateSettings,
      saveProvince, deleteProvince,
      saveCity, deleteCity,
      saveSite, deleteSite,
      saveCityDistance, deleteCityDistance,
      saveExpenseCategory, deleteExpenseCategory,
      saveDieselSupplier, deleteDieselSupplier,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
