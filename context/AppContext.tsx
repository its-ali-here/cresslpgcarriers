'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppDB, Trip, Party, Transaction, Expense, PeshgiEntry, FleetItem, Driver, ComplianceDoc, Settings } from '@/lib/types';
import * as db from '@/lib/db';
import { uid } from '@/lib/utils';

interface AppContextValue extends AppDB {
  loading: boolean;
  // Trips
  saveTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  // Parties
  saveParty: (party: Party) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
  // Transactions
  addTransaction: (txn: Omit<Transaction, 'id'> & { party: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Expenses
  saveExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Peshgi
  savePeshgi: (entry: PeshgiEntry) => Promise<void>;
  deletePeshgi: (id: string) => Promise<void>;
  // Fleet
  saveFleet: (item: FleetItem) => Promise<void>;
  deleteFleet: (id: string) => Promise<void>;
  // Drivers
  saveDriver: (driver: Driver) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  // Compliance
  saveCompliance: (doc: ComplianceDoc) => Promise<void>;
  deleteCompliance: (id: string) => Promise<void>;
  // Settings
  updateSettings: (s: Settings) => Promise<void>;
  // Helpers
  getPartyBalance: (partyId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppDB>({
    trips: [], parties: [], transactions: [], expenses: [],
    peshgi: [], fleet: [], drivers: [], compliance: [],
    settings: { company: 'CRESS LPG CARRIERS', yard: '', driverDaily: 0, helperDaily: 0, tripDays: 0, dieselBench: 2.6 },
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
    setState(prev => {
      const idx = prev.trips.findIndex(t => t.id === trip.id);
      const trips = idx >= 0
        ? prev.trips.map(t => t.id === trip.id ? trip : t)
        : [...prev.trips, trip];
      return { ...prev, trips };
    });
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    await db.deleteTrip(id);
    setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id) }));
  }, []);

  // PARTIES
  const saveParty = useCallback(async (party: Party) => {
    await db.upsertParty(party);
    setState(prev => {
      const idx = prev.parties.findIndex(p => p.id === party.id);
      const parties = idx >= 0
        ? prev.parties.map(p => p.id === party.id ? party : p)
        : [...prev.parties, party];
      return { ...prev, parties };
    });
  }, []);

  const deleteParty = useCallback(async (id: string) => {
    await db.deleteParty(id);
    setState(prev => ({
      ...prev,
      parties: prev.parties.filter(p => p.id !== id),
      transactions: prev.transactions.filter(t => t.party !== id),
    }));
  }, []);

  // TRANSACTIONS
  const addTransaction = useCallback(async (txn: Omit<Transaction, 'id'> & { party: string }) => {
    const full: Transaction = { id: uid(), ...txn } as Transaction;
    await db.insertTransaction(full);
    setState(prev => ({ ...prev, transactions: [...prev.transactions, full] }));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await db.deleteTransaction(id);
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  // EXPENSES
  const saveExpense = useCallback(async (expense: Expense) => {
    await db.upsertExpense(expense);
    setState(prev => {
      const idx = prev.expenses.findIndex(e => e.id === expense.id);
      const expenses = idx >= 0
        ? prev.expenses.map(e => e.id === expense.id ? expense : e)
        : [...prev.expenses, expense];
      return { ...prev, expenses };
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await db.deleteExpense(id);
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  // PESHGI
  const savePeshgi = useCallback(async (entry: PeshgiEntry) => {
    await db.upsertPeshgi(entry);
    setState(prev => {
      const idx = prev.peshgi.findIndex(p => p.id === entry.id);
      const peshgi = idx >= 0
        ? prev.peshgi.map(p => p.id === entry.id ? entry : p)
        : [...prev.peshgi, entry];
      return { ...prev, peshgi };
    });
  }, []);

  const deletePeshgi = useCallback(async (id: string) => {
    await db.deletePeshgi(id);
    setState(prev => ({ ...prev, peshgi: prev.peshgi.filter(p => p.id !== id) }));
  }, []);

  // FLEET
  const saveFleet = useCallback(async (item: FleetItem) => {
    await db.upsertFleet(item);
    setState(prev => {
      const idx = prev.fleet.findIndex(f => f.id === item.id);
      const fleet = idx >= 0
        ? prev.fleet.map(f => f.id === item.id ? item : f)
        : [...prev.fleet, item];
      return { ...prev, fleet };
    });
  }, []);

  const deleteFleet = useCallback(async (id: string) => {
    await db.deleteFleet(id);
    setState(prev => ({ ...prev, fleet: prev.fleet.filter(f => f.id !== id) }));
  }, []);

  // DRIVERS
  const saveDriver = useCallback(async (driver: Driver) => {
    await db.upsertDriver(driver);
    setState(prev => {
      const idx = prev.drivers.findIndex(d => d.id === driver.id);
      const drivers = idx >= 0
        ? prev.drivers.map(d => d.id === driver.id ? driver : d)
        : [...prev.drivers, driver];
      return { ...prev, drivers };
    });
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    await db.deleteDriver(id);
    setState(prev => ({ ...prev, drivers: prev.drivers.filter(d => d.id !== id) }));
  }, []);

  // COMPLIANCE
  const saveCompliance = useCallback(async (doc: ComplianceDoc) => {
    await db.upsertCompliance(doc);
    setState(prev => {
      const idx = prev.compliance.findIndex(c => c.id === doc.id);
      const compliance = idx >= 0
        ? prev.compliance.map(c => c.id === doc.id ? doc : c)
        : [...prev.compliance, doc];
      return { ...prev, compliance };
    });
  }, []);

  const deleteCompliance = useCallback(async (id: string) => {
    await db.deleteCompliance(id);
    setState(prev => ({ ...prev, compliance: prev.compliance.filter(c => c.id !== id) }));
  }, []);

  // SETTINGS
  const updateSettings = useCallback(async (s: Settings) => {
    await db.saveSettings(s);
    set('settings', s);
  }, []);

  // HELPERS
  const getPartyBalance = useCallback((partyId: string): number => {
    const p = state.parties.find(x => x.id === partyId);
    if (!p) return 0;
    let bal = p.bal_type === 'dr' ? (p.opening || 0) : -(p.opening || 0);
    state.transactions
      .filter(t => t.party === partyId)
      .forEach(t => { bal += t.type === 'dr' ? t.amount : -t.amount; });
    return bal;
  }, [state.parties, state.transactions]);

  return (
    <AppContext.Provider value={{
      ...state, loading,
      saveTrip, deleteTrip,
      saveParty, deleteParty,
      addTransaction, deleteTransaction,
      saveExpense, deleteExpense,
      savePeshgi, deletePeshgi,
      saveFleet, deleteFleet,
      saveDriver, deleteDriver,
      saveCompliance, deleteCompliance,
      updateSettings,
      getPartyBalance,
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
