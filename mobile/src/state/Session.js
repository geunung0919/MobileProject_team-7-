import { createContext, useContext, useMemo, useState } from 'react';
import { storageKey } from '../features/fridge/domain/store.mjs';
import { routineStorageKey } from '../features/routine/domain/routines.mjs';
import { createApi } from '../lib/api';
const Context = createContext(null);
export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const api = useMemo(() => session ? createApi(session.url, session.token) : null, [session]);
  const storageScope = session ? storageKey(session.url, session.userId) : null;
  const routineKey = session ? routineStorageKey(session.url, session.userId) : null;
  return <Context.Provider value={{ api, setSession, storageScope, routineKey }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
