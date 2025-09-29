// Login.jsx - Updated version
import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login(){
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/profile";

  async function submit(e){
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(email, pass);
      
      // Redirect user based on their role
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
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
              disabled={loading}
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
              disabled={loading}
            />
          </label>
          {err && <div className="bad">{err}</div>}
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <div className="muted small">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </div>
    </section>
  );
}