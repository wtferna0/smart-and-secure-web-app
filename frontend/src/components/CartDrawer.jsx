import React from "react";
import "./CartDrawer.css";
import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

export default function CartDrawer(){
  const { open, setOpen, items, inc, dec, remove, total, clear } = useCart();
  const navigate = useNavigate();
  return (
    <aside className={`drawer ${open?'open':''}`} aria-hidden={!open}>
      <div className="drawer-head">
        <strong>Cart</strong>
        <button className="btn" onClick={()=>setOpen(false)}>✕</button>
      </div>

      <div className="drawer-body">
        {items.length===0 && <div className="muted">Cart is empty.</div>}
        {items.map(it=>(
          <div key={it.id} className="cart-row">
            <div className="grow">
              <div><strong>{it.name}</strong></div>
              <div className="muted small">Rs.{it.price} • qty {it.qty}</div>
            </div>
            <div className="row">
              <button className="btn" onClick={()=>dec(it.id)}>-</button>
              <button className="btn" onClick={()=>inc(it.id)}>+</button>
              <button className="btn" onClick={()=>remove(it.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div className="drawer-foot">
        <div><strong>Total:</strong> Rs.{total.toFixed(0)}</div>
        <div className="row">
          <button className="btn" onClick={clear}>Clear</button>
          <button className="btn btn-primary" disabled={items.length === 0}
                onClick={() => {setOpen(false); navigate("/checkout");}}
>
  Checkout
</button>

        </div>
      </div>
    </aside>
  );
}
