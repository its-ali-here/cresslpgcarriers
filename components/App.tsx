'use client';

import { useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Expenses from './pages/Expenses';
import Fleet from './pages/Fleet';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Destinations from './pages/Destinations';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';

export default function App() {
  const { role } = useUser();
  const [page, setPage] = useState(role === 'operator' ? 'trips' : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useApp();

  function navigate(p: string) {
    if (p === 'settings' && role !== 'admin') return;
    setPage(p);
    setSidebarOpen(false);
  }

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
      case 'expenses': return <Expenses />;
      case 'destinations': return <Destinations />;
      case 'fleet': return <Fleet />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  return (
    <>
      <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="layout">
        <Sidebar current={page} onNavigate={navigate} open={sidebarOpen} />
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="main">
          {renderPage()}
        </div>
      </div>
    </>
  );
}
