import { createContext, useContext, useMemo, useState } from 'react';
import { createApi } from '../lib/api';
const Context = createContext(null);
export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const api = useMemo(() => session ? createApi(session.url, session.token) : null, [session]);
  return <Context.Provider value={{ api, setSession }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
