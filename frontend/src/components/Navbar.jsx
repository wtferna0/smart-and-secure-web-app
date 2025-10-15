import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { setOpen, cartItems = [], getCartTotal = () => 0 } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const active = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  // Calculate total items in cart
  const totalItems = Array.isArray(cartItems) 
    ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0;

  const hasItems = totalItems > 0;

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

          <button 
            className="btn cart-btn" 
            onClick={() => setOpen(true)}
            style={styles.cartButton}
          >
            Cart
            {hasItems && (
              <span style={styles.cartBadge}>
                {totalItems}
              </span>
            )}
          </button>

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

const styles = {
  cartButton: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  cartBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: "#dc2626",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1
  }
};