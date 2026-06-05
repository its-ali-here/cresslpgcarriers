'use client';

import { useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import PartyLedger from './pages/PartyLedger';
import Expenses from './pages/Expenses';
import Peshgi from './pages/Peshgi';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useApp } from '@/context/AppContext';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const { loading } = useApp();


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy)', color: '#9fb0c9', fontFamily: 'var(--cond)', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Loading…
      </div>
    );
  }

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'trips': return <Trips />;
      case 'clients': return <PartyLedger type="client" title="Client ledgers" sub="receivables & payment tracking" />;
      case 'fuel-suppliers': return <PartyLedger type="fuel" title="Fuel supplier ledgers" sub="diesel purchases & payments" />;
      case 'vendors': return <PartyLedger type="vendor" title="Vendor / parts ledgers" sub="workshops, parts suppliers, services" />;
      case 'expenses': return <Expenses />;
      case 'peshgi': return <Peshgi />;
      case 'fleet': return <Fleet />;
      case 'drivers': return <Drivers />;
      case 'compliance': return <Compliance />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  return (
    <>
      <Topbar />
      <div className="layout">
        <Sidebar current={page} onNavigate={setPage} />
        <div className="main">
          {renderPage()}
        </div>
      </div>
    </>
  );
}
