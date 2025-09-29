import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar(){
  const { user, logout } = useAuth();
  const { setOpen } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  function closeMobile(){
    setMobileOpen(false);
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Brand */}
        <Link className="brand" to="/" onClick={closeMobile}>
          <span className="logo">☕</span>
          <span className="brand-txt">
            <strong>QWIK BREW</strong>
            <small>Smart & Secure Web App</small>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="nav-left">
          <NavLink className={active} to="/">Home</NavLink>
          <NavLink className={active} to="/menu">Menu</NavLink>
          <NavLink className={active} to="/about">About</NavLink>
          <NavLink className={active} to="/play">Play Now</NavLink>
          <NavLink className={active} to="/contact">Contact</NavLink>
        </nav>

        {/* Right actions (cart + auth) */}
        <nav className="nav-right">
          {user?.role === "admin" && (
            <NavLink className={active} to="/admin">Admin</NavLink>
          )}
          {user?.role === "customer" && (
            <NavLink className={active} to="/profile">My Profile</NavLink>
          )}

          <button className="btn cart-btn" onClick={()=>setOpen(true)}>
            Cart
          </button>

          {!user ? (
            <>
              <NavLink className="btn sign-btn" to="/signup">Sign up</NavLink>
              <NavLink className="btn btn-primary login-btn" to="/login">Login</NavLink>
            </>
          ) : (
            <button
              className="btn logout-btn"
              onClick={()=>{
                logout();
                navigate("/");
                closeMobile();
              }}
            >
              Sign Out
            </button>
          )}

          {/* Hamburger (mobile only) */}
          <button
            className={`hamburger ${mobileOpen ? "is-open" : ""}`}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={()=>setMobileOpen(v=>!v)}
          >
            <span/>
            <span/>
            <span/>
          </button>
        </nav>
      </div>

      {/* Mobile menu panel */}
      <div className={`mm ${mobileOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="mm-inner">
          <div className="mm-head">
            <span className="mm-title">Menu</span>
            <button className="btn mm-close" onClick={closeMobile}>✕</button>
          </div>

          <div className="mm-section">
            <NavLink className={active} to="/" onClick={closeMobile}>Home</NavLink>
            <NavLink className={active} to="/menu" onClick={closeMobile}>Menu</NavLink>
            <NavLink className={active} to="/about" onClick={closeMobile}>About</NavLink>
            <NavLink className={active} to="/play" onClick={closeMobile}>Play Now</NavLink>
            <NavLink className={active} to="/contact" onClick={closeMobile}>Contact</NavLink>
          </div>

          <div className="mm-section">
            {user?.role === "admin" && (
              <NavLink className={active} to="/admin" onClick={closeMobile}>Admin</NavLink>
            )}
            {user?.role === "customer" && (
              <NavLink className={active} to="/profile" onClick={closeMobile}>My Profile</NavLink>
            )}
            <button className="btn w-full" onClick={() => { setOpen(true); closeMobile(); }}>
              View Cart
            </button>
          </div>

          <div className="mm-auth">
            {!user ? (
              <>
                <NavLink className="btn w-full" to="/signup" onClick={closeMobile}>Sign up</NavLink>
                <NavLink className="btn btn-primary w-full" to="/login" onClick={closeMobile}>Login</NavLink>
              </>
            ) : (
              <button className="btn w-full" onClick={() => { logout(); navigate("/"); closeMobile(); }}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {mobileOpen && <div className="mm-backdrop" onClick={closeMobile} />}
    </header>
  );
}
