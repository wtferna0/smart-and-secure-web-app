// Signup.jsx - Updated version with phone number
import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Signup(){
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setErr("");
    
    if (pass.length < 6) return setErr("Password must be at least 6 characters.");
    if (pass !== confirm) return setErr("Passwords do not match.");

    setLoading(true);

    try {
      const result = await register({ name, email, phone, password: pass });
      
      // If we get here, registration was successful (even with fallback)
      console.log('✅ Registration completed, navigating to profile');
      navigate("/profile", { replace: true });
      
    } catch (error) {
      console.error('💥 Registration failed:', error);
      
      // Check if user might have been created anyway
      if (error.message.includes('500') || error.message.includes('fallback')) {
        setErr("Account may have been created. Try logging in manually.");
      } else {
        setErr(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login">
      <h1>Create your account</h1>
      <div className="card c-pad" style={{ maxWidth: 520 }}>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <label style={{ display:"grid", gap:6 }}>
            Full Name
            <input 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              placeholder="Your name" 
              required
              disabled={loading}
            />
          </label>
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
            Phone Number
            <input 
              type="tel" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)} 
              placeholder="+94 (555) 123-4567" 
              required
              disabled={loading}
            />
          </label>
          <div className="row" style={{ gap: 10 }}>
            <label style={{ display:"grid", gap:6, flex:1 }}>
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
            <label style={{ display:"grid", gap:6, flex:1 }}>
              Confirm
              <input 
                type="password" 
                value={confirm} 
                onChange={e=>setConfirm(e.target.value)} 
                placeholder="••••••••" 
                required
                disabled={loading}
              />
            </label>
          </div>

          {err && <div className="bad">{err}</div>}
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="muted small">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
}