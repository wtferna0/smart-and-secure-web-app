// In Checkout.jsx - Major updates
import React, { useMemo, useState, useEffect } from "react";
import "./Checkout.css";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import PayHereCheckout from "./PayHereCheckout.jsx"; // Add this import

export default function Checkout() {
  const { cartItems: items, cartTotal: total, clearCart } = useCart();
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [showPayHereModal, setShowPayHereModal] = useState(false);
  const [payHereFormData, setPayHereFormData] = useState(null);

  // User state
  const [user, setUser] = useState({
    name: authUser?.first_name && authUser?.last_name ? `LKR{authUser.first_name} LKR{authUser.last_name}` : "",
    email: authUser?.email || "",
    phone: authUser?.phone,
    address: "",
    city: "",
  });

  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [stage, setStage] = useState("form");
  const [orderId, setOrderId] = useState(null);
  const [finalOrderSummary, setFinalOrderSummary] = useState(null);

  // Get user points
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const points = authUser.points_balance || 0;
      setUserPoints(points);
    }
  }, [isAuthenticated, authUser]);

  // Update user info when authUser changes
  useEffect(() => {
    if (authUser && isAuthenticated) {
      setUser(prev => ({
        ...prev,
        name: authUser.first_name && authUser.last_name ? `LKR{authUser.first_name} LKR{authUser.last_name}` : prev.name,
        email: authUser.email || prev.email, phone: authUser.phone || prev.phone,
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

  // Apply promo code
  const applyCode = async () => {
    if (!promo.trim()) {
      alert("Enter a promo code.");
      return;
    }

    if (appliedPromo) {
      alert("Only one promo code per order.");
      return;
    }

    setCheckingPromo(true);
    setError("");

    try {
      console.log("🎯 Checking promo code:", promo.trim());

      const result = await api.applyPromoCode({
        code: promo.trim().toUpperCase(),
        order_total: subTotal,
        email: user.email || 'guest@example.com'
      });

      console.log("✅ Promo code validation result:", result);

      if (result.success) {
        setAppliedPromo({
          code: result.code,
          discount_amount: result.discount_amount,
          discount_type: result.discount_type,
          promo_amount: result.promo_amount,
          min_order_total: result.min_order_total,
          message: result.message
        });
        setPromo("");
        alert(`Promo code applied! LKR{result.message}`);
      } else {
        alert(result.error || "Invalid or expired promo code.");
      }

    } catch (err) {
      console.error("❌ Promo code validation failed:", err);
      alert(err.message || "Failed to validate promo code. Please try again.");
    } finally {
      setCheckingPromo(false);
    }
  };

  // Calculate promo discount
  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    return appliedPromo.discount_amount || 0;
  }, [appliedPromo]);

  const removePromo = () => {
    setAppliedPromo(null);
  };

  // Points discount (1 point = 1 LKR) - applied AFTER promo
  const pointsDiscount = useMemo(() => {
    if (!usePoints || pointsToUse === 0) return 0;
    return Math.min(pointsToUse, subTotal - promoDiscount);
  }, [usePoints, pointsToUse, subTotal, promoDiscount]);

  const taxes = Math.round((subTotal - promoDiscount - pointsDiscount) * 0.08);
  const grand = Math.max(0, subTotal - promoDiscount - pointsDiscount + taxes);

  const createOrder = async () => {
    try {
      // Calculate FINAL amounts after ALL discounts
      const finalSubtotal = subTotal;
      const finalDiscount = promoDiscount + pointsDiscount;
      const finalTotal = grand;

      console.log("📦 Creating order with final amounts:", {
        subtotal: finalSubtotal,
        promoDiscount,
        pointsDiscount,
        total: finalTotal,
        pointsRedeemed: usePoints ? pointsToUse : 0
      });

      // Calculate points earned from this order (5% of final total)
      const pointsEarned = usePoints ? 0 : Math.round(finalTotal * 0.05);

      // Save the final order summary
      setFinalOrderSummary({
        subtotal: finalSubtotal,
        promoDiscount: promoDiscount,
        pointsDiscount: pointsDiscount,
        taxes: taxes,
        grandTotal: finalTotal,
        pointsUsed: usePoints ? pointsToUse : 0,
        pointsEarned: pointsEarned,
        promoCode: appliedPromo?.code
      });

      // Order data structure
      const orderData = {
        items: items.map(item => ({
          menu_item_id: item.id,
          qty: item.quantity,
          price: item.price,
          name: item.name
        })),
        subtotal: finalSubtotal,
        total: finalTotal,
        discount_total: finalDiscount,
        points_redeemed: usePoints ? pointsToUse : 0,
        points_earned: pointsEarned,
        ...(appliedPromo && { applied_promo_code: appliedPromo.code }),
        ...(!isAuthenticated && { guest_email: user.email }),
        ...(!isAuthenticated && {
          customer_name: user.name,
          customer_phone: user.phone
        })
      };

      console.log('📤 Sending order data to backend:', orderData);

      const response = await api.createOrder(orderData);
      console.log('✅ Order creation response:', response);

      if (response.points_balance !== undefined) {
        setUserPoints(response.points_balance);
        localStorage.setItem('latest_points', response.points_balance.toString());
      }

      return response;

    } catch (err) {
      console.error('❌ Order creation failed:', err);
      throw err;
    }
  };

  const checkOrderStatus = async (orderId) => {
    try {
      const order = await api.getOrder(orderId);
      console.log('📋 Order status after payment:', order.status);
      return order.status;
    } catch (error) {
      console.error('❌ Failed to fetch order status:', error);
      return null;
    }
  };

  // NEW: Initialize PayHere Checkout
  const initPayHerePayment = async (order) => {
    try {
      console.log("🚀 Initializing PayHere checkout for order:", order.id);

      // Match the backend expected structure
      const checkoutData = {
        order_id: order.id,  // This is the key field backend expects
        first_name: user.name.split(' ')[0] || 'Customer',
        last_name: user.name.split(' ').slice(1).join(' ') || 'Guest',
        email: user.email,
        phone: user.phone || '+94123456789',
        address: user.address || 'Not specified',
        city: user.city || 'Colombo',
        country: 'Sri Lanka'
      };

      console.log('📤 PayHere checkout data:', checkoutData);

      const payhereResponse = await api.initPayHereCheckout(checkoutData);
      console.log('✅ PayHere response:', payhereResponse);

      setPayHereFormData(payhereResponse);
      setShowPayHereModal(true);

    } catch (err) {
      console.error('❌ PayHere initialization failed:', err);
      throw err;
    }
  };

  // UPDATED: Main payment handler
  // In Checkout.jsx - Add mock payment option for development
  const handleMockPayment = async () => {
    setLoading(true);

    try {
      // Create order as usual
      const order = await createOrder();
      console.log('✅ Mock order created:', order);

      // Simulate successful payment after 2 seconds
      setTimeout(() => {
        setStage("paid");
        clearCart();
        alert('Mock payment completed successfully!');
        navigate('/order-success?order_id=' + order.id);
      }, 2000);

    } catch (err) {
      setError('Mock payment failed: ' + err.message);
      setLoading(false);
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
      console.log("🚀 Starting PayHere payment process...");

      // 1. Create order first
      console.log("📦 Step 1: Creating order...");
      const order = await createOrder();
      console.log('✅ Order created successfully:', order);

      if (!order || !order.id) {
        throw new Error("Order creation failed - no order ID returned");
      }

      // 2. Initialize PayHere checkout
      console.log("💳 Step 2: Initializing PayHere checkout...");
      await initPayHerePayment(order);

      // Order ID is saved for success page
      setOrderId(order.id);

    } catch (err) {
      console.error("❌ Payment process failed:", err);

      let errorMessage = err.message || "Payment failed. Please try again.";

      if (err.message.includes("Network Error")) {
        errorMessage = "Network connection failed. Please check your internet.";
      } else if (err.message.includes("500")) {
        errorMessage = "Server error. Please contact support.";
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Handle PayHere modal close
  const handlePayHereClose = () => {
    setShowPayHereModal(false);
    setPayHereFormData(null);
    setLoading(false);
  };

  // Handle successful PayHere payment (called from return URL)
  const handlePayHereSuccess = async () => {
    console.log("🎉 PayHere payment completed successfully!");

    // Verify order status with backend
    if (orderId) {
      const status = await checkOrderStatus(orderId);
      console.log('✅ Final order status:', status);
    }

    setStage("paid");
    clearCart();
    setShowPayHereModal(false);

    window.dispatchEvent(new Event('orderCompleted'));
    localStorage.setItem('user_points_updated', Date.now().toString());
  };

  // Check if we're returning from PayHere
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      handlePayHereSuccess();
    }
  }, []);

  // ... rest of your component (empty cart, paid stage, etc.) remains similar ...
  // Just make sure to add the PayHere modal at the end of your return statement

  return (
    <section className="checkout">
      <h1>Checkout</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="grid ck-grid">
        {/* Left: Contact Details - UPDATED WITH ADDRESS FIELDS */}
        <div className="card c-pad">
          <h3>Contact Details</h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </label>
            <label>
              Email *
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
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
              Phone *
              <input
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="+94 ..."
                required
              />
            </label>
            <label>
              Address
              <input
                value={user.address}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
                placeholder="Enter your address"
              />
            </label>
            <label>
              City
              <input
                value={user.city}
                onChange={(e) => setUser({ ...user, city: e.target.value })}
                placeholder="Enter your city"
              />
            </label>
          </div>

          {/* Loyalty Points Section (same as before) */}
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
              placeholder="Enter code e.g., PUZZLEDMX0JI"
              disabled={!!appliedPromo || checkingPromo}
            />
            <button
              className="btn"
              onClick={appliedPromo ? removePromo : applyCode}
              disabled={checkingPromo}
            >
              {checkingPromo ? "Checking..." : appliedPromo ? "Remove" : "Apply"}
            </button>
          </div>
          {appliedPromo && (
            <div className="muted small" style={{ marginTop: ".3rem" }}>
              Applied: <strong>{appliedPromo.code}</strong> - {appliedPromo.message}
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
            disabled={items.length === 0 || loading || !user.name || !user.email || !user.phone}
          >
            {loading ? "Preparing Payment..." : `Pay with PayHere - LKR {grand}`}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleMockPayment}
            disabled={items.length === 0 || loading || !user.name || !user.email || !user.phone}
          >
            {loading ? "Processing Mock Payment..." : "Mock Payment (Dev)"}
          </button>

          <div className="muted small" style={{ marginTop: ".4rem", textAlign: 'center' }}>
            🔒 Secure payment powered by PayHere
          </div>
        </aside>
      </div>

      {/* PayHere Checkout Modal */}
      {showPayHereModal && payHereFormData && (
        <PayHereCheckout
          formData={payHereFormData}
          onClose={handlePayHereClose}
        />
      )}
    </section>
  );
}