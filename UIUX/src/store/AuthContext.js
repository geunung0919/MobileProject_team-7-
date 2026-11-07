import React, { createContext, useContext, useState } from 'react';
import { request } from '../services/client';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const api = (path, method, body) => request(session.base, session.token, path, method, body);
  const login = async (next) => {
    let profile = null;
    if (!next.demo) {
      await request(next.base, next.token, '/api/v1/me/identity');
      try { profile = (await request(next.base, next.token, '/api/v1/me/onboarding')).profile; }
      catch (e) { if (e.status !== 404) throw e; }
    }
    setOnboarding(profile); setSession(next);
  };
  const finish = async (profile) => {
    if (!session.demo) await api('/api/v1/me/onboarding', 'PUT', profile);
    setOnboarding(profile);
  };
  const logout = async () => {
    if (session?.token && !session.demo) {
      try { await request(session.base, '', '/api/v1/auth/logout', 'POST', {token: session.token}); }
      catch { /* Always clear the device session, even while offline. Server session expires in 24h. */ }
    }
    setSession(null); setOnboarding(null);
  };
  return <Context.Provider value={{ session, onboarding, login, finish, logout, api }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
