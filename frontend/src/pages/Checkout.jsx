import React, { useMemo, useState } from "react";
import "./Checkout.css";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const VALID_CODES = [
  { code:"SAVE10", type:"percent", value:10, label:"10% off" },
  { code:"FREELATTE", type:"flat", value:155, label:"Free Latte (₹155)" },
  { code:"BIRTHDAY20", type:"percent", value:20, label:"20% off birthday" },
];

export default function Checkout(){
  const { cartItems: items, cartTotal: total, clearCart } = useCart();
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User state - pre-fill with authenticated user data if available
  const [user, setUser] = useState({ 
    name: authUser?.first_name && authUser?.last_name ? `${authUser.first_name} ${authUser.last_name}` : "", 
    email: authUser?.email || "", 
    phone: "", 
  });
  
  const [usePoints, setUsePoints] = useState(false);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null);
  const [stage, setStage] = useState("form"); // "form" | "paid"
  const [orderId, setOrderId] = useState(null); // Store the actual order ID

  // Update user info when authUser changes
  React.useEffect(() => {
    if (authUser && isAuthenticated) {
      setUser(prev => ({
        ...prev,
        name: authUser.first_name && authUser.last_name ? `${authUser.first_name} ${authUser.last_name}` : prev.name,
        email: authUser.email || prev.email,
      }));
    }
  }, [authUser, isAuthenticated]);

  const subTotal = useMemo(() => Math.round(total), [total]);

  const promoDiscount = useMemo(() => {
    if(!applied) return 0;
    const code = VALID_CODES.find(v => v.code.toLowerCase() === applied.toLowerCase());
    if(!code) return 0;
    if(code.type === "percent") return Math.round(subTotal * (code.value/100));
    if(code.type === "flat") return Math.min(code.value, subTotal);
    return 0;
  }, [applied, subTotal]);

  const pointsDiscount = useMemo(() => {
    if(!usePoints) return 0;
    // For now, simple points system - adjust based on your loyalty program
    return Math.min(100, subTotal - promoDiscount); // Max 100 points discount for demo
  }, [usePoints, promoDiscount, subTotal]);

  const taxes = Math.round((subTotal - promoDiscount - pointsDiscount) * 0.08);
  const grand = Math.max(0, subTotal - promoDiscount - pointsDiscount + taxes);

  function applyCode(){
    const ok = VALID_CODES.some(v => v.code.toLowerCase() === promo.trim().toLowerCase());
    if(!promo.trim()) return alert("Enter a code.");
    if(applied) return alert("Only one promo code per order.");
    if(!ok) return alert("Invalid or expired code.");
    setApplied(promo.trim());
    setPromo("");
  }

  const createOrder = async () => {
    try {
      const orderData = {
        items: items.map(item => ({
          menu_item_id: item.id,
          qty: item.quantity,
          price_each: item.price, // Include price for verification
          item_name: item.name // Include item name for display
        })),
        subtotal: subTotal,
        total: grand,
        tax_amount: taxes,
        discount_amount: promoDiscount + pointsDiscount,
        status: 'pending_payment',
        // Include promo code if applied
        ...(applied && { promo_code: applied }),
        // Include guest info only if not authenticated
        ...(!isAuthenticated && {
          guest_email: user.email,
          guest_name: user.name,
          guest_phone: user.phone || undefined
        })
      };

      console.log('Creating order:', {
        isAuthenticated,
        user: authUser,
        orderData
      });
      
      const response = await api.createOrder(orderData);
      console.log('Order creation response:', response);
      
      if (response && response.id) {
        setOrderId(response.id); // Store the actual order ID
        return response;
      } else {
        throw new Error('Invalid order response from server');
      }

    } catch (err) {
      console.error('Order creation failed:', err);
      throw err;
    }
  };

  const handlePayment = async () => {
    // Basic validation
    if (!user.name || !user.email) {
      alert("Please fill in your name and email");
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create order in backend
      const order = await createOrder();
      console.log('Order created successfully:', order);
      
      // 2. For demo - simulate payment success
      // In production, you would integrate with PayHere here
      setTimeout(() => {
        setStage("paid");
        clearCart(); // Empty cart after successful order
        setLoading(false);
        
        // Log success details
        console.log('Order completed:', {
          orderId: order.id,
          orderToken: order.order_token,
          userId: authUser?.id,
          isAuthenticated
        });
      }, 1500);

    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.message || "Failed to create order. Please try again.");
      setLoading(false);
    }
  };

  if(items.length === 0 && stage === "form"){
    return (
      <section className="checkout">
        <h1>Checkout</h1>
        <div className="card c-pad">
          <p>Your cart is empty. Add items from the <a className="btn" href="/menu">Menu</a>.</p>
        </div>
      </section>
    );
  }

  if(stage === "paid"){
    // Use actual order ID if available, otherwise fallback to demo ID
    const displayOrderId = orderId ? `QB-${orderId}` : "QB-" + (1000 + Math.floor(Math.random() * 9000));
    
    return (
      <section className="checkout">
        <h1>Order Placed Successfully 🎉</h1>
        <div className="card c-pad">
          <p>Thank you, <strong>{user.name}</strong>! Your order has been received.</p>
          <ul className="ok-list">
            <li>Order ID: <strong>{displayOrderId}</strong></li>
            <li>Order status: <strong>Pending Payment</strong></li>
            <li>We'll send confirmation to {user.email}</li>
            <li>
              {isAuthenticated ? (
                <>Track your order in <a href="/profile">My Profile → Orders</a></>
              ) : (
                <>We've sent order details to your email</>
              )}
            </li>
            {!isAuthenticated && (
              <li className="muted small">
                <a href="/signup">Create an account</a> to track orders and earn loyalty points
              </li>
            )}
          </ul>
          <div className="row" style={{marginTop:".6rem"}}>
            {isAuthenticated ? (
              <button className="btn btn-primary" onClick={() => navigate("/profile")}>View Order History</button>
            ) : (
              <button className="btn" onClick={() => navigate("/")}>Home</button>
            )}
            <a className="btn btn-primary" href="/menu">Order More</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout">
      <h1>Checkout</h1>
      
      {!isAuthenticated && (
        <div className="guest-notice card c-pad" style={{marginBottom: '1rem', background: '#fff3cd', borderColor: '#ffeaa7'}}>
          <strong>Guest Checkout</strong>
          <p className="muted small" style={{margin: '0.3rem 0 0 0'}}>
            You're checking out as a guest. <a href="/login">Log in</a> or <a href="/signup">create an account</a> to track orders and earn loyalty points.
          </p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="grid ck-grid">
        {/* Left: Contact Details */}
        <div className="card c-pad">
          <h3>Contact Details</h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input 
                value={user.name} 
                onChange={(e) => setUser({...user, name: e.target.value})}
                placeholder="Enter your full name"
                required
              />
            </label>
            <label>
              Email *
              <input 
                type="email" 
                value={user.email}
                onChange={(e) => setUser({...user, email: e.target.value})}
                placeholder="Enter your email"
                required
                disabled={isAuthenticated} // Disable email if authenticated (it comes from account)
              />
            </label>
            {isAuthenticated && (
              <div className="muted small" style={{gridColumn: '1 / -1', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px'}}>
                🔒 Email is managed by your account
              </div>
            )}
            <label>
              Phone
              <input 
                value={user.phone}
                onChange={(e) => setUser({...user, phone: e.target.value})}
                placeholder="+94 ..." 
              />
            </label>
          </div>

          {isAuthenticated && (
            <>
              <h3 style={{marginTop:".8rem"}}>Loyalty Points</h3>
              <div className="loy-row">
                <label className="row">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                  />
                  Apply loyalty points discount (up to ₹100)
                </label>
              </div>
            </>
          )}

          <h3 style={{marginTop:".8rem"}}>Promo Code</h3>
          <div className="row">
            <input 
              className="promo" 
              value={promo} 
              onChange={e => setPromo(e.target.value)} 
              placeholder="Enter code e.g., SAVE10" 
            />
            <button className="btn" onClick={applyCode} disabled={!!applied}>
              {applied ? "Applied" : "Apply"}
            </button>
          </div>
          {applied && (
            <div className="muted small" style={{marginTop:".3rem"}}>
              Applied: <strong>{applied}</strong>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <aside className="card c-pad">
          <h3>Order Summary</h3>
          <ul className="sum-list">
            {items.map(it => (
              <li key={it.id}>
                <div className="grow">
                  <strong>{it.name}</strong>
                  <div className="muted small">Qty {it.quantity}</div>
                </div>
                <div>₹{(it.price * it.quantity).toFixed(0)}</div>
              </li>
            ))}
          </ul>

          <div className="line"><span>Subtotal</span><span>₹{subTotal}</span></div>
          {promoDiscount > 0 && (
            <div className="line"><span>Promo Discount</span><span>- ₹{promoDiscount}</span></div>
          )}
          {pointsDiscount > 0 && isAuthenticated && (
            <div className="line"><span>Loyalty Discount</span><span>- ₹{pointsDiscount}</span></div>
          )}
          <div className="line"><span>Taxes (8%)</span><span>₹{taxes}</span></div>
          <div className="line total"><span>Total</span><span>₹{grand}</span></div>

          <button
            className="btn btn-primary pay-btn"
            onClick={handlePayment}
            disabled={items.length === 0 || loading || !user.name || !user.email}
          >
            {loading ? "Creating Order..." : `Place Order - ₹${grand}`}
          </button>

          <div className="muted small" style={{marginTop:".4rem"}}>
            {isAuthenticated 
              ? "✓ Your order will be linked to your account and appear in Order History"
              : "You'll receive order confirmation via email"
            }
          </div>
        </aside>
      </div>
    </section>
  );
}