import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { setOpen } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const active = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/">QWIK BREW</Link>

        {/* Hamburger button for mobile */}
        <button
          className="hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        <nav className={`nav-left ${mobileMenuOpen ? "open" : ""}`}>
          <NavLink className={active} to="/">Home</NavLink>
          <NavLink className={active} to="/menu">Menu</NavLink>
          <NavLink className={active} to="/about">About</NavLink>
          <NavLink className={active} to="/play">Play Now</NavLink>
          <NavLink className={active} to="/contact">Contact</NavLink>
        </nav>

        <nav className="nav-right">
          {user?.is_staff && (
            <NavLink className={active} to="/admin">Admin</NavLink>
          )}
          {user && !user?.is_staff && (
            <NavLink className={active} to="/profile">My Profile</NavLink>
          )}

          <button className="btn" onClick={() => setOpen(true)}>Cart</button>

          {!user && (
            <>
              <NavLink className="btn" to="/signup">Sign up</NavLink>
              <NavLink className="btn btn-primary" to="/login">Login</NavLink>
            </>
          )}
          {user && (
            <button
              className="btn"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
