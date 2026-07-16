import { useEffect, useState } from 'react';
import { bootstrapModules, ensureLocalUser, type UserProfile } from '../modules';

export function useAppBootstrap() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bootstrapModules();
        const profile = await ensureLocalUser();
        if (!cancelled) {
          setUser(profile);
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, user, error, setUser };
}
