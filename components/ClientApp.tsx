'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as db from '@/lib/db';
import type { UserProfile } from '@/lib/types';
import { AppProvider } from '@/context/AppContext';
import { UserProvider } from '@/context/UserContext';
import App from '@/components/App';
import LoginScreen from '@/components/LoginScreen';

const LOADING = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy)', color: '#9fb0c9', fontFamily: 'var(--cond)', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
    Loading…
  </div>
);

export default function ClientApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(undefined);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    db.fetchUserProfile(session.user.id).then(p =>
      setProfile(p ?? { userId: session.user.id, role: 'viewer', name: session.user.email ?? '' })
    );
  }, [session]);

  if (session === undefined || (session && profile === undefined)) return LOADING;
  if (!session) return <LoginScreen />;

  return (
    <UserProvider profile={profile!}>
      <AppProvider>
        <App />
      </AppProvider>
    </UserProvider>
  );
}
