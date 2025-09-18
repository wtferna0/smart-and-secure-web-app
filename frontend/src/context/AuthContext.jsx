import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // user: null | { role: 'customer'|'admin', name?:string, email?:string }
  const [user, setUser] = useState(null);

  // load once from localStorage so auth survives refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  const login = (role, info = {}) => {
    const next = { role, ...info };
    setUser(next);
    localStorage.setItem("auth_user", JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
