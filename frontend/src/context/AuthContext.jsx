import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);

// LocalStorage keys (demo only)
const LS_USER = "auth_user";     // current signed-in user
const LS_USERS = "auth_users";   // simple user registry (demo)

function readUsers() {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeUsers(list) {
  try { localStorage.setItem(LS_USERS, JSON.stringify(list)); } catch {}
}

export function AuthProvider({ children }) {
  // user: null | { role: 'customer'|'admin', name?:string, email?:string }
  const [user, setUser] = useState(null);

  // load once from localStorage so auth survives refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_USER);
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  // DEMO: Login (kept as-is: any email/password + role picker)
  const login = (role, info = {}) => {
    const next = { role, ...info };
    setUser(next);
    localStorage.setItem(LS_USER, JSON.stringify(next));
  };

  // DEMO: Register (creates a user record then logs them in)
  // For production: call your backend API instead of localStorage.
  const register = ({ name, email, password, role = "customer" }) => {
    const users = readUsers();
    const exists = users.some(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (exists) {
      const err = new Error("An account with this email already exists.");
      err.code = "EMAIL_IN_USE";
      throw err;
    }
    const record = { name, email, password, role }; // NOTE: plain password ONLY for demo
    users.push(record);
    writeUsers(users);

    // auto-login after signup
    const next = { role, name, email };
    setUser(next);
    localStorage.setItem(LS_USER, JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_USER);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
