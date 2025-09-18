import React, { useState } from "react";
import "./login.css"; // keep or remove if not used
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login(){
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("customer"); // 'customer' | 'admin'
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  function submit(e){
    e.preventDefault();
    setErr("");

    // Demo auth: any email/password is accepted
    // In production, replace with real API call then set role from server.
    if(mode !== "customer" && mode !== "admin"){
      return setErr("Select a role.");
    }

    login(mode, { email, name: email?.split("@")[0] || (mode === "admin" ? "Admin" : "Customer") });

    // Redirect: prefer where they tried to go, else role home
    if (from) return navigate(from, { replace: true });
    if (mode === "admin") return navigate("/admin", { replace: true });
    return navigate("/profile", { replace: true });
  }

  return (
    <section className="login">
      <h1>Welcome to Brew & Bytes</h1>
      <div className="card c-pad" style={{ maxWidth: 520 }}>
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <button className={`btn ${mode==='customer'?'btn-primary':''}`} onClick={()=>setMode("customer")}>Customer</button>
          <button className={`btn ${mode==='admin'?'btn-primary':''}`} onClick={()=>setMode("admin")}>Admin/Staff</button>
        </div>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <label style={{ display:"grid", gap:6 }}>
            Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required/>
          </label>
          <label style={{ display:"grid", gap:6 }}>
            Password
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required/>
          </label>
          {err && <div className="bad">{err}</div>}
          <button className="btn btn-primary" type="submit">Sign In</button>
          <div className="muted small">Demo: any email & password. Role is chosen above.</div>
        </form>
      </div>
    </section>
  );
}
