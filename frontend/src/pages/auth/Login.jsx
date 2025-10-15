// Login.jsx - Improved UI version
import React, { useState } from "react";
import "./login.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/profile";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const result = await login(email, pass);
      
      // Check if user is staff and redirect accordingly
      if (result.isStaff) {
        console.log('➡️ Redirecting staff user to admin');
        navigate("/admin", { replace: true });
      } else {
        console.log('➡️ Redirecting regular user to:', from);
        navigate(from, { replace: true });
      }
      
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login" style={styles.container}>
      <div className="card c-pad" style={styles.card}>
        <div style={styles.header}>
          <h1>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>
        
        <form onSubmit={submit} className="grid" style={styles.form}>
          <label style={styles.label}>
            Email
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@email.com" 
              required
              disabled={loading}
              style={styles.input}
            />
          </label>
          
          <label style={styles.label}>
            Password
            <input 
              type="password" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              placeholder="••••••••" 
              required
              disabled={loading}
              style={styles.input}
            />
          </label>
          
          {err && <div className="bad">{err}</div>}
          
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          
          <div className="muted small" style={styles.footer}>
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    backgroundColor: "var(--bg, #f8fafc)"
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    borderRadius: "12px"
  },
  header: {
    textAlign: "center",
    marginBottom: "24px"
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0
  },
  form: {
    gap: "16px"
  },
  label: {
    display: "grid",
    gap: "6px"
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "16px",
    transition: "all 0.2s ease",
    backgroundColor: "white"
  },
  button: {
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "8px"
  },
  footer: {
    textAlign: "center",
    marginTop: "16px"
  }
};