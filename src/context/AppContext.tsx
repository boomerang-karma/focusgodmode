import React, { createContext, useContext, useMemo } from 'react';
import type { UserProfile } from '../modules';
import { useAppBootstrap } from '../hooks/useAppBootstrap';

interface AppContextValue {
  ready: boolean;
  user: UserProfile | null;
  error: string | null;
  setUser: (u: UserProfile | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const boot = useAppBootstrap();
  const value = useMemo(() => boot, [boot.ready, boot.user, boot.error]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
