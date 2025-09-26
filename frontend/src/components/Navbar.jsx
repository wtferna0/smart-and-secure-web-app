import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar(){
  const { user, logout } = useAuth();
  const { setOpen } = useCart();
  const navigate = useNavigate();

  const active = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/">QWIK BREW</Link>

        <nav className="nav-left">
          <NavLink className={active} to="/">Home</NavLink>
          <NavLink className={active} to="/menu">Menu</NavLink>
          <NavLink className={active} to="/about">About</NavLink>
          <NavLink className={active} to="/play">Play Now</NavLink>
          <NavLink className={active} to="/contact">Contact</NavLink>
        </nav>

        <nav className="nav-right">
          {/* Admin entry only for admins */}
          {user?.role === "admin" && (
            <NavLink className={active} to="/admin">Admin</NavLink>
          )}

          {/* Customer profile */}
          {user?.role === "customer" && (
            <NavLink className={active} to="/profile">My Profile</NavLink>
          )}

          {/* Cart always available */}
          <button className="btn" onClick={()=>setOpen(true)}>Cart</button>

          {/* Auth buttons */}
          {!user && (
            <>
              <NavLink className="btn" to="/signup">Sign up</NavLink>
              <NavLink className="btn btn-primary" to="/login">Login</NavLink>
            </>
          )}
          {user && (
            <button
              className="btn"
              onClick={()=>{
                logout();
                navigate("/"); // back to public
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
