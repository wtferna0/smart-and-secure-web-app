import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

    if(mode !== "customer" && mode !== "admin"){
      return setErr("Select a role.");
    }

    // DEMO: any email/password works; role chosen by toggle
    login(mode, { email, name: email?.split("@")[0] || (mode === "admin" ? "Admin" : "Customer") });

    if (from) return navigate(from, { replace: true });
    if (mode === "admin") return navigate("/admin", { replace: true });
    return navigate("/profile", { replace: true });
  }

  return (
    <section className="login">
      <h1>Welcome back</h1>
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
          <div className="muted small">
            Demo: any email & password. Role is chosen above.
          </div>
        </form>

        <div className="muted small" style={{ marginTop: 10 }}>
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </section>
  );
}
