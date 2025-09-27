import React, { useMemo, useState } from "react";
import "./checkout.css";
import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const VALID_CODES = [
  { code:"SAVE10", type:"percent", value:10, label:"10% off" },
  { code:"FREELATTE", type:"flat", value:155, label:"Free Latte (₹155)" },
  { code:"BIRTHDAY20", type:"percent", value:20, label:"20% off birthday" },
];

export default function Checkout(){
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // derive display values from the signed-in user (safe fallbacks for guests)
  const displayName   = user?.name  || "Guest";
  const displayEmail  = user?.email || "";
  // demo: if you don’t store points yet, fall back to 300 so UI works
  const loyaltyPoints = Number.isFinite(user?.loyaltyPoints) ? user.loyaltyPoints : 300;

  const [usePoints, setUsePoints] = useState(false);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null);
  const [stage, setStage] = useState("form"); // "form" | "paid"

  const subTotal = useMemo(()=> Math.round(total), [total]);

  const promoDiscount = useMemo(()=>{
    if(!applied) return 0;
    const code = VALID_CODES.find(v=>v.code.toLowerCase()===applied.toLowerCase());
    if(!code) return 0;
    if(code.type==="percent") return Math.round(subTotal * (code.value/100));
    if(code.type==="flat") return Math.min(code.value, subTotal);
    return 0;
  }, [applied, subTotal]);

  // basic rule: 1 point = ₹1 (adjust to your policy)
  const maxPointsRedeemable = Math.min(loyaltyPoints, subTotal - promoDiscount);
  const pointsDiscount = useMemo(()=>{
    if(!usePoints) return 0;
    return maxPointsRedeemable;
  }, [usePoints, maxPointsRedeemable, promoDiscount, subTotal]);

  const taxes = Math.round((subTotal - promoDiscount - pointsDiscount) * 0.08); // demo 8% tax
  const grand = Math.max(0, subTotal - promoDiscount - pointsDiscount + taxes);

  function applyCode(){
    const ok = VALID_CODES.some(v=>v.code.toLowerCase()===promo.trim().toLowerCase());
    if(!promo.trim()) return alert("Enter a code.");
    if(applied) return alert("Only one promo code per order.");
    if(!ok) return alert("Invalid or expired code.");
    setApplied(promo.trim());
    setPromo("");
  }

  function mockPay(){
    // Replace with real PayHere init later
    setTimeout(()=>{
      setStage("paid");
      clear(); // empty cart after payment
    }, 400);
  }

  if(items.length===0 && stage==="form"){
    return (
      <section className="checkout">
        <h1>Checkout</h1>
        <div className="card c-pad">
          <p>Your cart is empty. Add items from the <a className="btn" href="/menu">Menu</a>.</p>
        </div>
      </section>
    );
  }

  if(stage==="paid"){
    const orderId = "QB-" + (1000 + Math.floor(Math.random()*9000));
    return (
      <section className="checkout">
        <h1>Payment Successful 🎉</h1>
        <div className="card c-pad">
          <p>Thank you, <strong>{displayName}</strong>! Your order <strong>{orderId}</strong> has been placed.</p>
          <ul className="ok-list">
            <li>We’ve emailed a receipt to {displayEmail || "your email"} (demo).</li>
            <li>Your loyalty points will update after pickup (per FR-14).</li>
            <li>Track it anytime in <a href="/profile">My Profile → Orders</a>.</li>
          </ul>
          <div className="row" style={{marginTop:".6rem"}}>
            <button className="btn" onClick={()=>navigate("/profile")}>Go to Profile</button>
            <a className="btn btn-primary" href="/menu">Order More</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout">
      <h1>Checkout</h1>

      <div className="grid ck-grid">
        {/* Left: Contact & Payment Details (demo-only) */}
        <div className="card c-pad">
          <h3>Contact Details</h3>
          <div className="form-grid">
            <label>Full Name<input defaultValue={displayName}/></label>
            <label>Email<input type="email" defaultValue={displayEmail}/></label>
            <label>Phone<input placeholder="+94 ..." /></label>
          </div>

          <h3 style={{marginTop:".8rem"}}>Payment Method</h3>
          <div className="pay-methods">
            <label><input type="radio" name="pm" defaultChecked /> PayHere (card/wallet)</label>
            <label><input type="radio" name="pm" /> Cash on Pickup (demo)</label>
          </div>

          <h3 style={{marginTop:".8rem"}}>Loyalty Points</h3>
          <div className="loy-row">
            <div>Available: <strong>{loyaltyPoints} pts</strong></div>
            <label className="row">
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e)=>setUsePoints(e.target.checked)}
                disabled={maxPointsRedeemable<=0}
              />
              Apply up to <strong>&nbsp;{maxPointsRedeemable} pts</strong> (₹1/pt)
            </label>
          </div>

          <h3 style={{marginTop:".8rem"}}>Promo Code</h3>
          <div className="row">
            <input className="promo" value={promo} onChange={e=>setPromo(e.target.value)} placeholder="Enter code e.g., SAVE10" />
            <button className="btn" onClick={applyCode} disabled={!!applied}>Apply</button>
          </div>
          {applied && <div className="muted small" style={{marginTop:".3rem"}}>Applied: <strong>{applied}</strong></div>}
        </div>

        {/* Right: Order Summary */}
        <aside className="card c-pad">
          <h3>Order Summary</h3>
          <ul className="sum-list">
            {items.map(it=>(
              <li key={it.id}>
                <div className="grow">
                  <strong>{it.name}</strong>
                  <div className="muted small">Qty {it.qty}</div>
                </div>
                <div>₹{(it.price*it.qty).toFixed(0)}</div>
              </li>
            ))}
          </ul>

          <div className="line"><span>Subtotal</span><span>₹{subTotal}</span></div>
          <div className="line"><span>Promo</span><span>- ₹{promoDiscount}</span></div>
          <div className="line"><span>Loyalty</span><span>- ₹{pointsDiscount}</span></div>
          <div className="line"><span>Taxes (8%)</span><span>₹{taxes}</span></div>
          <div className="line total"><span>Total</span><span>₹{grand}</span></div>

          <button
            className="btn btn-primary pay-btn"
            onClick={mockPay}
            disabled={items.length===0}
          >
            Pay (Mock) ₹{grand}
          </button>

          <div className="muted small" style={{marginTop:".4rem"}}>
            * Demo only. Replace with PayHere init to meet FR-12/21 in your proposal.
          </div>
        </aside>
      </div>
    </section>
  );
}
