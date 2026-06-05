import { supabase } from './supabase';
import type {
  Trip, Party, Transaction, Expense, PeshgiEntry,
  FleetItem, Driver, ComplianceDoc, Settings, AppDB,
} from './types';

// ---- TRIPS ----
function mapTrip(row: Record<string, unknown>): Trip {
  const { from_location, to_location, ...rest } = row as Record<string, unknown>;
  return { ...rest, from: from_location, to: to_location } as Trip;
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
  const { error } = await supabase.from('trips').upsert(unmapTrip(trip));
  if (error) throw error;
}
export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
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
  const { error } = await supabase.from('transactions').insert(unmapTxn(txn));
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
  const { error } = await supabase.from('expenses').upsert(expense);
  if (error) throw error;
}
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ---- PESHGI ----
export async function fetchPeshgi(): Promise<PeshgiEntry[]> {
  const { data, error } = await supabase
    .from('peshgi').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []) as PeshgiEntry[];
}
export async function upsertPeshgi(entry: PeshgiEntry): Promise<void> {
  const { error } = await supabase.from('peshgi').upsert(entry);
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
  const { error } = await supabase.from('fleet').upsert(item);
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
  const { error } = await supabase.from('drivers').upsert(driver);
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
  const { error } = await supabase.from('compliance').upsert(doc);
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

// ---- FETCH ALL ----
export async function fetchAll(): Promise<AppDB> {
  const [trips, parties, transactions, expenses, peshgi, fleet, drivers, compliance, settings] =
    await Promise.all([
      fetchTrips(), fetchParties(), fetchTransactions(), fetchExpenses(),
      fetchPeshgi(), fetchFleet(), fetchDrivers(), fetchCompliance(), fetchSettings(),
    ]);
  return { trips, parties, transactions, expenses, peshgi, fleet, drivers, compliance, settings };
}
