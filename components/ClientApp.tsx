'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppProvider } from '@/context/AppContext';
import App from '@/components/App';
import LoginScreen from '@/components/LoginScreen';

export default function ClientApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy)', color: '#9fb0c9', fontFamily: 'var(--cond)', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Loading…
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
