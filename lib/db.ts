import { supabase } from './supabase';
import type {
  Trip, Expense,
  FleetItem, Driver, Settings, AppDB,
  Province, City, Site, CityDistance, UserProfile, ExpenseCategory, DieselSupplier, DieselPurchase,
} from './types';
import { uid } from './utils';

// Convert empty strings to null for date columns so Postgres doesn't reject them.
function nullDates(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out = { ...obj };
  for (const f of fields) {
    if (out[f] === '' || out[f] === undefined) out[f] = null;
  }
  return out;
}

async function graceful<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn(); } catch (err) { console.error('DB fetch failed:', err); return []; }
}

// ---- TRIPS ----
function mapTrip(row: Record<string, unknown>): Trip {
  const { from_location, to_location, ...rest } = row as Record<string, unknown>;
  return {
    from_province: '', from_city: '', to_province: '', to_city: '',
    ...rest,
    from: (from_location as string) || '',
    to: (to_location as string) || '',
  } as Trip;
}
function unmapTrip(trip: Trip): Record<string, unknown> {
  const { from, to, ...rest } = trip;
  return { ...rest, from_location: from, to_location: to };
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips').select('*').order('load_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTrip);
}
export async function upsertTrip(trip: Trip): Promise<void> {
  const row = nullDates(unmapTrip(trip), ['load_date', 'offload_date', 'trip_start_date', 'trip_end_date']);
  const { error } = await supabase.from('trips').upsert(row);
  if (error) throw error;
}
export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

// Mirrors a trip's diesel purchases into a normalized table (keyed by trip_id) for cross-trip analysis.
export async function syncDieselPurchases(tripId: string, rows: DieselPurchase[]): Promise<void> {
  const { error: delErr } = await supabase.from('diesel_purchases').delete().eq('trip_id', tripId);
  if (delErr) throw delErr;
  const payload = rows
    .filter(r => r.supplier || r.litres || r.price || r.amount)
    .map(r => ({
      id: uid(), trip_id: tripId,
      date: r.date || null, supplier: r.supplier, litres: r.litres, price: r.price, amount: r.amount,
    }));
  if (!payload.length) return;
  const { error } = await supabase.from('diesel_purchases').insert(payload);
  if (error) throw error;
}
export async function batchUpdateTripNos(updates: { id: string; no: string }[]): Promise<void> {
  if (!updates.length) return;
  const { error } = await supabase.from('trips').upsert(updates, { onConflict: 'id' });
  if (error) throw error;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!data) return null;
  return { userId: data.id, role: data.role, name: data.name || '' };
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data } = await supabase.from('profiles').select('*').order('name');
  if (!data) return [];
  return data.map(r => ({ userId: r.id, role: r.role, name: r.name || '' }));
}

export async function approveTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').update({ approved: true }).eq('id', id);
  if (error) throw error;
}

export async function flagTrip(id: string, flagged: boolean): Promise<void> {
  const { error } = await supabase.from('trips').update({ flagged }).eq('id', id);
  if (error) throw error;
}



// ---- EXPENSES ----
export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []) as Expense[];
}
export async function upsertExpense(expense: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(nullDates(expense as unknown as Record<string, unknown>, ['date']));
  if (error) throw error;
}
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}


// ---- BOWSERS ----
export async function fetchFleet(): Promise<FleetItem[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('bowsers').select('*').order('bowser_make');
    if (error) return [];
    return (data || []) as FleetItem[];
  });
}
export async function upsertFleet(item: FleetItem): Promise<void> {
  const { error } = await supabase.from('bowsers').upsert(item);
  if (error) throw error;
}
export async function deleteFleet(id: string): Promise<void> {
  const { error } = await supabase.from('bowsers').delete().eq('id', id);
  if (error) throw error;
}
export async function approveFleet(id: string): Promise<void> {
  const { error } = await supabase.from('bowsers').update({ approved: true }).eq('id', id);
  if (error) throw error;
}

// ---- VEHICLES ----
export async function fetchDrivers(): Promise<Driver[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('vehicles').select('*').order('vehicle_no');
    if (error) return [];
    return (data || []) as Driver[];
  });
}
export async function upsertDriver(driver: Driver): Promise<void> {
  const { error } = await supabase.from('vehicles').upsert(driver);
  if (error) throw error;
}
export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}
export async function approveDriver(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ approved: true }).eq('id', id);
  if (error) throw error;
}


// ---- SETTINGS ----
const DEFAULT_SETTINGS: Settings = {
  company: 'CRESS LPG CARRIERS',
  yard: '',
  driverDaily: 0,
  helperDaily: 0,
  tripDays: 0,
  dieselBench: 2.6,
};

export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  return {
    company: data.company || DEFAULT_SETTINGS.company,
    yard: data.yard || '',
    driverDaily: data.driver_daily || 0,
    helperDaily: data.helper_daily || 0,
    tripDays: data.trip_days || 0,
    dieselBench: data.diesel_bench || 2.6,
  };
}
export async function saveSettings(s: Settings): Promise<void> {
  const { error } = await supabase.from('settings').upsert({
    id: 1,
    company: s.company,
    yard: s.yard,
    driver_daily: s.driverDaily,
    helper_daily: s.helperDaily,
    trip_days: s.tripDays,
    diesel_bench: s.dieselBench,
  });
  if (error) throw error;
}

// ---- PROVINCES ----
export async function fetchProvinces(): Promise<Province[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('provinces').select('*').order('name');
    if (error) return [];
    return (data || []) as Province[];
  });
}
export async function upsertProvince(p: Province): Promise<void> {
  const { error } = await supabase.from('provinces').upsert(p);
  if (error) throw error;
}
export async function deleteProvince(id: string): Promise<void> {
  const { error } = await supabase.from('provinces').delete().eq('id', id);
  if (error) throw error;
}

// ---- CITIES ----
export async function fetchCities(): Promise<City[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('cities').select('*').order('name');
    if (error) return [];
    return (data || []) as City[];
  });
}
export async function upsertCity(c: City): Promise<void> {
  const { error } = await supabase.from('cities').upsert(c);
  if (error) throw error;
}
export async function deleteCity(id: string): Promise<void> {
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw error;
}

// ---- SITES ----
export async function fetchSites(): Promise<Site[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('sites').select('*').order('name');
    if (error) return [];
    return (data || []) as Site[];
  });
}
export async function upsertSite(s: Site): Promise<void> {
  const { error } = await supabase.from('sites').upsert(s);
  if (error) throw error;
}
export async function deleteSite(id: string): Promise<void> {
  const { error } = await supabase.from('sites').delete().eq('id', id);
  if (error) throw error;
}

// ---- EXPENSE CATEGORIES ----
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('expense_categories').select('*').order('name');
    if (error) return [];
    return (data || []) as ExpenseCategory[];
  });
}
export async function upsertExpenseCategory(cat: ExpenseCategory): Promise<void> {
  const { error } = await supabase.from('expense_categories').upsert(cat);
  if (error) throw error;
}
export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---- DIESEL SUPPLIERS ----
export async function fetchDieselSuppliers(): Promise<DieselSupplier[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('diesel_suppliers').select('*').order('name');
    if (error) return [];
    return (data || []) as DieselSupplier[];
  });
}
export async function upsertDieselSupplier(s: DieselSupplier): Promise<void> {
  const { error } = await supabase.from('diesel_suppliers').upsert(s);
  if (error) throw error;
}
export async function deleteDieselSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('diesel_suppliers').delete().eq('id', id);
  if (error) throw error;
}

// ---- CITY DISTANCES ----
export async function fetchCityDistances(): Promise<CityDistance[]> {
  return graceful(async () => {
    const { data, error } = await supabase.from('city_distances').select('*');
    if (error) return [];
    return (data || []) as CityDistance[];
  });
}
export async function upsertCityDistance(d: CityDistance): Promise<void> {
  const { error } = await supabase.from('city_distances').upsert(d);
  if (error) throw error;
}
export async function deleteCityDistance(id: string): Promise<void> {
  const { error } = await supabase.from('city_distances').delete().eq('id', id);
  if (error) throw error;
}

// ---- FETCH ALL ----
export async function fetchAll(): Promise<AppDB> {
  const [
    trips, expenses,
    fleet, drivers, settings,
    provinces, cities, sites, cityDistances, expenseCategories, dieselSuppliers,
  ] = await Promise.all([
    fetchTrips(), fetchExpenses(),
    fetchFleet(), fetchDrivers(), fetchSettings(),
    fetchProvinces(), fetchCities(), fetchSites(), fetchCityDistances(),
    fetchExpenseCategories(), fetchDieselSuppliers(),
  ]);
  return {
    trips, expenses,
    fleet, drivers, settings,
    provinces, cities, sites, cityDistances, expenseCategories, dieselSuppliers,
  };
}
