'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '@/lib/types';

const UserContext = createContext<UserProfile | null>(null);

export function useUser(): UserProfile {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

export function UserProvider({ profile, children }: { profile: UserProfile; children: ReactNode }) {
  return <UserContext.Provider value={profile}>{children}</UserContext.Provider>;
}
