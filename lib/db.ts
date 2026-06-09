import { supabase } from './supabase';
import type {
  Trip, Party, Transaction, Expense, PeshgiEntry,
  FleetItem, Driver, ComplianceDoc, Settings, AppDB,
  Province, City, Site, CityDistance, UserProfile, ExpenseCategory,
} from './types';

// Convert empty strings to null for date columns so Postgres doesn't reject them.
function nullDates(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out = { ...obj };
  for (const f of fields) {
    if (out[f] === '' || out[f] === undefined) out[f] = null;
  }
  return out;
}

async function graceful<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn(); } catch { return []; }
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
  const row = nullDates(unmapTrip(trip), ['load_date', 'offload_date']);
  const { error } = await supabase.from('trips').upsert(row);
  if (error) throw error;
}
export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
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

// ---- PARTIES ----
export async function fetchParties(): Promise<Party[]> {
  const { data, error } = await supabase.from('parties').select('*').order('name');
  if (error) throw error;
  return (data || []) as Party[];
}
export async function upsertParty(party: Party): Promise<void> {
  const { error } = await supabase.from('parties').upsert(party);
  if (error) throw error;
}
export async function deleteParty(id: string): Promise<void> {
  const { error } = await supabase.from('parties').delete().eq('id', id);
  if (error) throw error;
}

// ---- TRANSACTIONS ----
function mapTxn(row: Record<string, unknown>): Transaction {
  const { description, ...rest } = row;
  return { ...rest, desc: description } as Transaction;
}
function unmapTxn(txn: Transaction): Record<string, unknown> {
  const { desc, ...rest } = txn;
  return { ...rest, description: desc };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTxn);
}
export async function insertTransaction(txn: Transaction): Promise<void> {
  const row = nullDates(unmapTxn(txn), ['date']);
  const { error } = await supabase.from('transactions').insert(row);
  if (error) throw error;
}
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
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

// ---- PESHGI ----
export async function fetchPeshgi(): Promise<PeshgiEntry[]> {
  return graceful(async () => {
    const { data, error } = await supabase
      .from('peshgi').select('*').order('date', { ascending: false });
    if (error) return [];
    return (data || []) as PeshgiEntry[];
  });
}
export async function upsertPeshgi(entry: PeshgiEntry): Promise<void> {
  const { error } = await supabase.from('peshgi').upsert(nullDates(entry as unknown as Record<string, unknown>, ['date']));
  if (error) throw error;
}
export async function deletePeshgi(id: string): Promise<void> {
  const { error } = await supabase.from('peshgi').delete().eq('id', id);
  if (error) throw error;
}

// ---- FLEET ----
export async function fetchFleet(): Promise<FleetItem[]> {
  const { data, error } = await supabase.from('fleet').select('*').order('reg');
  if (error) throw error;
  return (data || []) as FleetItem[];
}
export async function upsertFleet(item: FleetItem): Promise<void> {
  const { error } = await supabase.from('fleet').upsert(nullDates(item as unknown as Record<string, unknown>, ['service']));
  if (error) throw error;
}
export async function deleteFleet(id: string): Promise<void> {
  const { error } = await supabase.from('fleet').delete().eq('id', id);
  if (error) throw error;
}

// ---- DRIVERS ----
export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from('drivers').select('*').order('name');
  if (error) throw error;
  return (data || []) as Driver[];
}
export async function upsertDriver(driver: Driver): Promise<void> {
  const { error } = await supabase.from('drivers').upsert(nullDates(driver as unknown as Record<string, unknown>, ['lic_exp']));
  if (error) throw error;
}
export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) throw error;
}

// ---- COMPLIANCE ----
export async function fetchCompliance(): Promise<ComplianceDoc[]> {
  const { data, error } = await supabase
    .from('compliance').select('*').order('expiry');
  if (error) throw error;
  return (data || []) as ComplianceDoc[];
}
export async function upsertCompliance(doc: ComplianceDoc): Promise<void> {
  const { error } = await supabase.from('compliance').upsert(nullDates(doc as unknown as Record<string, unknown>, ['issue', 'expiry']));
  if (error) throw error;
}
export async function deleteCompliance(id: string): Promise<void> {
  const { error } = await supabase.from('compliance').delete().eq('id', id);
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
    trips, parties, transactions, expenses, peshgi,
    fleet, drivers, compliance, settings,
    provinces, cities, sites, cityDistances, expenseCategories,
  ] = await Promise.all([
    fetchTrips(), fetchParties(), fetchTransactions(), fetchExpenses(),
    fetchPeshgi(), fetchFleet(), fetchDrivers(), fetchCompliance(), fetchSettings(),
    fetchProvinces(), fetchCities(), fetchSites(), fetchCityDistances(),
    fetchExpenseCategories(),
  ]);
  return {
    trips, parties, transactions, expenses, peshgi,
    fleet, drivers, compliance, settings,
    provinces, cities, sites, cityDistances, expenseCategories,
  };
}
