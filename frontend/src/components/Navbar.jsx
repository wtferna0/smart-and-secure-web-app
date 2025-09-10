import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar(){
  const { items, setOpen } = useCart();
  const count = items.reduce((s,i)=>s+i.qty,0);

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="logo">☕</span>
          <div className="brand-txt">
            <strong>QWIK BREW</strong>
            <small>Premium Coffee & More</small>
          </div>
        </Link>

        <nav className="links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/play">Play Now</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <div className="right">
          <Link className="btn badge" to="/admin">⚙︎ Admin</Link>
          <button className="btn badge" onClick={()=>setOpen(true)}>🛒 Cart <span className="pill">{count}</span></button>
          <Link className="btn" to="/login">🔒 Login</Link>
        </div>
      </div>
    </header>
  );
}
