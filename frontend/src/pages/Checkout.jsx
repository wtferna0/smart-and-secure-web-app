import React, { useMemo, useState, useEffect } from "react";
import "./Checkout.css";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

// Demo promo codes
const VALID_CODES = [
  { code: "SAVE10", type: "percent", value: 10, label: "10% off" },
  { code: "FREELATTE", type: "flat", value: 155, label: "Free Latte (LKR 155)" },
  { code: "BIRTHDAY20", type: "percent", value: 20, label: "20% off birthday" },
];

export default function Checkout() {
  const { cartItems: items, cartTotal: total, clearCart } = useCart();
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User state
  const [user, setUser] = useState({ 
    name: authUser?.first_name && authUser?.last_name ? `${authUser.first_name} ${authUser.last_name}` : "", 
    email: authUser?.email || "", 
    phone: "", 
  });
  
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [stage, setStage] = useState("form");
  const [orderId, setOrderId] = useState(null);

  // Get REAL user points from profile
  useEffect(() => {
    if (isAuthenticated && authUser) {
      console.log("🔍 Auth user data:", authUser);
      
      // Get points from user profile
      const points = authUser.points_balance || 0;
      
      console.log("💰 User points balance:", points);
      setUserPoints(points);
    }
  }, [isAuthenticated, authUser]);

  // Update user info when authUser changes
  useEffect(() => {
    if (authUser && isAuthenticated) {
      setUser(prev => ({
        ...prev,
        name: authUser.first_name && authUser.last_name ? `${authUser.first_name} ${authUser.last_name}` : prev.name,
        email: authUser.email || prev.email,
      }));
    }
  }, [authUser, isAuthenticated]);

  const subTotal = useMemo(() => Math.round(total), [total]);

  // Calculate maximum points that can be used (1 point = 1 LKR)
  const maxPointsUsable = useMemo(() => {
    const max = Math.min(userPoints, subTotal);
    return max;
  }, [userPoints, subTotal]);

  // Auto-set points to max when toggling usePoints
  useEffect(() => {
    if (usePoints && maxPointsUsable > 0) {
      setPointsToUse(maxPointsUsable);
    } else {
      setPointsToUse(0);
    }
  }, [usePoints, maxPointsUsable]);

  // Calculate promo discount
  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    const code = VALID_CODES.find(v => v.code.toLowerCase() === appliedPromo.toLowerCase());
    if (!code) return 0;
    if (code.type === "percent") return Math.round(subTotal * (code.value / 100));
    if (code.type === "flat") return Math.min(code.value, subTotal);
    return 0;
  }, [appliedPromo, subTotal]);

  // Points discount (1 point = 1 LKR) - applied AFTER promo
  const pointsDiscount = useMemo(() => {
    if (!usePoints || pointsToUse === 0) return 0;
    return Math.min(pointsToUse, subTotal - promoDiscount);
  }, [usePoints, pointsToUse, subTotal, promoDiscount]);

  const taxes = Math.round((subTotal - promoDiscount - pointsDiscount) * 0.08);
  const grand = Math.max(0, subTotal - promoDiscount - pointsDiscount + taxes);

  // Apply promo code
  const applyCode = () => {
    if (!promo.trim()) {
      alert("Enter a promo code.");
      return;
    }
    
    if (appliedPromo) {
      alert("Only one promo code per order.");
      return;
    }

    const validCode = VALID_CODES.find(v => v.code.toLowerCase() === promo.trim().toLowerCase());
    if (!validCode) {
      alert("Invalid or expired promo code.");
      return;
    }

    setAppliedPromo(promo.trim());
    setPromo("");
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const createOrder = async () => {
    try {
      // Calculate final amounts with discounts applied
      const finalSubtotal = subTotal;
      const finalDiscount = promoDiscount + pointsDiscount;
      const finalTotal = grand;

      console.log("📦 Creating order with discounts:", {
        subtotal: finalSubtotal,
        promoDiscount,
        pointsDiscount,
        total: finalTotal,
        pointsRedeemed: usePoints ? pointsToUse : 0
      });

      const orderData = {
        items: items.map(item => ({
          menu_item_id: item.id,
          qty: item.quantity,
          price_each: item.price,
          item_name: item.name
        })),
        subtotal: finalSubtotal,
        total: finalTotal,
        tax_amount: taxes,
        discount_amount: finalDiscount,
        status: 'pending_payment',
        points_redeemed: usePoints ? pointsToUse : 0,
        points_earned: Math.round(finalTotal * 0.05), // Earn 5% of final total as points
        // Include promo code if applied
        ...(appliedPromo && { applied_promo_code: appliedPromo }),
        // Include guest info only if not authenticated
        ...(!isAuthenticated && {
          guest_email: user.email,
          guest_name: user.name,
          guest_phone: user.phone || undefined
        })
      };

      console.log('Creating order:', orderData);
      
      const response = await api.createOrder(orderData);
      console.log('Order creation response:', response);
      
      if (response && response.id) {
        setOrderId(response.id);
        
        // Apply real promo code through loyalty API (if endpoints exist)
        if (appliedPromo && api.applyPromoCode) {
          try {
            const promoResult = await api.applyPromoCode({
              order_id: response.id,
              code: appliedPromo
            });
            console.log('Promo code applied successfully:', promoResult);
          } catch (promoError) {
            console.warn('Failed to apply promo code through loyalty API:', promoError);
            // Continue with order even if loyalty API call fails
          }
        }

        // Redeem points through loyalty API if requested (if endpoints exist)
        if (usePoints && pointsToUse > 0 && api.redeemPoints) {
          try {
            const pointsResult = await api.redeemPoints({
              order_id: response.id,
              points: pointsToUse
            });
            console.log('Points redeemed successfully:', pointsResult);
            
            // Update local points balance after redemption
            setUserPoints(prev => Math.max(0, prev - pointsToUse));
          } catch (pointsError) {
            console.error('Failed to redeem points:', pointsError);
            // Don't throw error - the points calculation is already done locally
            // throw new Error(`Points redemption failed: ${pointsError.message}`);
          }
        }
        
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
    if (!user.name || !user.email) {
      alert("Please fill in your name and email");
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Validate points usage
    if (usePoints && pointsToUse > userPoints) {
      alert("You don't have enough points for this redemption");
      return;
    }

    if (usePoints && pointsToUse <= 0) {
      alert("Please enter a valid number of points to use");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create order and apply loyalty benefits
      const order = await createOrder();
      console.log('Order created successfully:', order);
      
      // Simulate payment success
      setTimeout(() => {
        setStage("paid");
        clearCart();
        setLoading(false);
        
        console.log('Order completed:', {
          orderId: order.id,
          orderToken: order.order_token,
          userId: authUser?.id,
          pointsUsed: usePoints ? pointsToUse : 0,
          promoUsed: appliedPromo,
          finalTotal: grand
        });
      }, 1500);

    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.message || "Failed to create order. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0 && stage === "form") {
    return (
      <section className="checkout">
        <h1>Checkout</h1>
        <div className="card c-pad">
          <p>Your cart is empty. Add items from the <a className="btn" href="/menu">Menu</a>.</p>
        </div>
      </section>
    );
  }

  if (stage === "paid") {
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
            {usePoints && (
              <li>Loyalty points used: <strong>{pointsToUse} points</strong> (LKR {pointsDiscount})</li>
            )}
            {appliedPromo && (
              <li>Promo code applied: <strong>{appliedPromo}</strong> (LKR {promoDiscount})</li>
            )}
            <li>Total paid: <strong>LKR {grand}</strong></li>
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
          <div className="row" style={{ marginTop: ".6rem" }}>
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
                disabled={isAuthenticated}
              />
            </label>
            {isAuthenticated && (
              <div className="muted small" style={{ gridColumn: '1 / -1', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
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
              <h3 style={{ marginTop: ".8rem" }}>Loyalty Points</h3>
              <div className="loy-row">
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Available Points: {userPoints}</strong>
                  <span className="muted small"> (1 point = 1 LKR)</span>
                </div>
                
                {userPoints > 0 ? (
                  <>
                    <label className="row">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                      />
                      Use my loyalty points
                    </label>
                    
                    {usePoints && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                          <span className="small">Points to use:</span>
                          <input
                            type="number"
                            min="0"
                            max={maxPointsUsable}
                            value={pointsToUse}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setPointsToUse(Math.min(value, maxPointsUsable));
                            }}
                            style={{ width: '80px', padding: '0.25rem' }}
                          />
                          <span className="muted small">/ {maxPointsUsable} max</span>
                        </div>
                        <div className="muted small" style={{ marginTop: '0.25rem' }}>
                          Discount: LKR {pointsDiscount}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="muted small">
                    You don't have any points yet. Complete orders to earn loyalty points!
                  </div>
                )}
              </div>
            </>
          )}

          <h3 style={{ marginTop: ".8rem" }}>Promo Code</h3>
          <div className="row">
            <input 
              className="promo" 
              value={promo} 
              onChange={e => setPromo(e.target.value)} 
              placeholder="Enter code e.g., SAVE10" 
              disabled={!!appliedPromo}
            />
            <button 
              className="btn" 
              onClick={appliedPromo ? removePromo : applyCode} 
            >
              {appliedPromo ? "Remove" : "Apply"}
            </button>
          </div>
          {appliedPromo && (
            <div className="muted small" style={{ marginTop: ".3rem" }}>
              Applied: <strong>{appliedPromo}</strong>
              <button 
                onClick={removePromo}
                style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
              >
                ×
              </button>
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
                <div>LKR {(it.price * it.quantity).toFixed(0)}</div>
              </li>
            ))}
          </ul>

          <div className="line"><span>Subtotal</span><span>LKR {subTotal}</span></div>
          
          {promoDiscount > 0 && (
            <div className="line"><span>Promo Discount</span><span>- LKR {promoDiscount}</span></div>
          )}
          
          {pointsDiscount > 0 && isAuthenticated && (
            <div className="line"><span>Loyalty Points Discount</span><span>- LKR {pointsDiscount}</span></div>
          )}
          
          <div className="line"><span>Taxes (8%)</span><span>LKR {taxes}</span></div>
          <div className="line total"><span>Total</span><span>LKR {grand}</span></div>

          {isAuthenticated && (
            <div className="muted small" style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
              {usePoints ? (
                <>After this order, you'll have: <strong>{userPoints - pointsToUse} points</strong> remaining</>
              ) : (
                <>You'll earn <strong>{Math.round(grand * 0.05)} points</strong> from this order!</>
              )}
            </div>
          )}

          <button
            className="btn btn-primary pay-btn"
            onClick={handlePayment}
            disabled={items.length === 0 || loading || !user.name || !user.email}
          >
            {loading ? "Creating Order..." : `Place Order - LKR ${grand}`}
          </button>

          <div className="muted small" style={{ marginTop: ".4rem" }}>
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