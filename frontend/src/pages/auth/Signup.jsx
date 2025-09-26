import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Signup(){
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("customer");   // Usually customers sign up; admins are added by staff
  const [err, setErr] = useState("");

  async function submit(e){
    e.preventDefault();
    setErr("");

    if (pass.length < 6) return setErr("Password must be at least 6 characters.");
    if (pass !== confirm) return setErr("Passwords do not match.");

    try {
      // DEMO: stores in localStorage and logs you in
      register({ name, email, password: pass, role });
      // Redirect based on role
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/profile", { replace: true });
    } catch (e) {
      setErr(e.message || "Sign up failed.");
    }
  }

  return (
    <section className="login">
      <h1>Create your account</h1>
      <div className="card c-pad" style={{ maxWidth: 520 }}>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <label style={{ display:"grid", gap:6 }}>
            Full Name
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/>
          </label>
          <label style={{ display:"grid", gap:6 }}>
            Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required/>
          </label>
          <div className="row" style={{ gap: 10 }}>
            <label style={{ display:"grid", gap:6, flex:1 }}>
              Password
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required/>
            </label>
            <label style={{ display:"grid", gap:6, flex:1 }}>
              Confirm
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" required/>
            </label>
          </div>

          {/* Optional role choice; keep visible for demo. Hide in production (admins created by staff). */}
          <div className="row" style={{ gap: 10 }}>
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" name="role" value="customer" checked={role==="customer"} onChange={()=>setRole("customer")} />
              Customer
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" name="role" value="admin" checked={role==="admin"} onChange={()=>setRole("admin")} />
              Admin/Staff (demo)
            </label>
          </div>

          {err && <div className="bad">{err}</div>}
          <button className="btn btn-primary" type="submit">Create Account</button>

          <div className="muted small">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
