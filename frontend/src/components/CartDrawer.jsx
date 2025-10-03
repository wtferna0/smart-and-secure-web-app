import React from "react";
import "./CartDrawer.css";
import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

export default function CartDrawer() {
  const { 
    isOpen, 
    setOpen, 
    cartItems = [], 
    updateQuantity = () => {}, 
    removeFromCart = () => {}, 
    getCartTotal = () => 0,
    clearCart = () => {}
  } = useCart();
  
  const navigate = useNavigate();

  // Safe array access
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const total = getCartTotal();

  const handleIncrement = (itemId) => {
    const item = safeItems.find(it => it.id === itemId);
    if (item) {
      updateQuantity(itemId, (item.quantity || 0) + 1);
    }
  };

  const handleDecrement = (itemId) => {
    const item = safeItems.find(it => it.id === itemId);
    if (item) {
      updateQuantity(itemId, (item.quantity || 0) - 1);
    }
  };

  const handleRemove = (itemId) => {
    removeFromCart(itemId);
  };

  const handleCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  const handleClear = () => {
    clearCart();
  };

  return (
    <aside className={`drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="drawer-head">
        <strong>Cart</strong>
        <button className="btn" onClick={() => setOpen(false)}>✕</button>
      </div>

      <div className="drawer-body">
        {safeItems.length === 0 && <div className="muted">Cart is empty.</div>}
        {safeItems.map(it => (
          <div key={it.id} className="cart-row">
            
            {/* Image at the top */}
            <div className="cart-item-image">
              <img 
                src={it.image} 
                alt={it.name}
                className="cart-image"
                onError={(e) => { 
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"; 
                }}
              />
            </div>

            {/* Item details */}
            <div className="grow">
              <div><strong>{it.name || "Unknown Item"}</strong></div>
              <div className="muted small">
                ${(parseFloat(it.price) || 0).toFixed(2)} • qty {it.quantity || 0}
              </div>
              <div className="small">
                Subtotal: ${((parseFloat(it.price) || 0) * (it.quantity || 0)).toFixed(2)}
              </div>
            </div>

            {/* Buttons */}
            <div className="row">
              <button 
                className="btn" 
                onClick={() => handleDecrement(it.id)}
                disabled={(it.quantity || 0) <= 1}
              >
                -
              </button>
              <button 
                className="btn" 
                onClick={() => handleIncrement(it.id)}
                disabled={(it.quantity || 0) >= (it.stock_qty || 0)}
              >
                +
              </button>
              <button 
                className="btn" 
                onClick={() => handleRemove(it.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>


      <div className="drawer-foot">
        <div><strong>Total:</strong> ${total.toFixed(2)}</div>
        <div className="row">
          <button 
            className="btn" 
            onClick={handleClear}
            disabled={safeItems.length === 0}
          >
            Clear
          </button>
          <button 
            className="btn btn-primary" 
            disabled={safeItems.length === 0}
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </div>
      </div>
    </aside>
  );
}