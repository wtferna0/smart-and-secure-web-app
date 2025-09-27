import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login(){
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  function submit(e){
    e.preventDefault();
    setErr("");
    console.log("came");
    try {
      const signedIn = loginWithCredentials(email, pass);
      // Redirect: prefer where they tried to go, else role home
      if (from) return navigate(from, { replace: true });
      if (signedIn.role === "admin") return navigate("/admin", { replace: true });
      if (signedIn.role === "customer") return navigate("/profile", { replace: true });
      return navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed.");
    }
  }

  return (
    <section className="login">
      <h1>Welcome back</h1>
      <div className="card c-pad" style={{ maxWidth: 520 }}>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <label style={{ display:"grid", gap:6 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </label>
          <label style={{ display:"grid", gap:6 }}>
            Password
            <input
              type="password"
              value={pass}
              onChange={e=>setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {err && <div className="bad">{err}</div>}
          <button className="btn btn-primary" type="submit">Sign In</button>
          <div className="muted small">
            Don’t have an account? <Link to="/signup">Create one</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
