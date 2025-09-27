import React, { useState } from "react";
import "./profile.css";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Profile(){
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");

  // Demo data (static for now)
  const loyalty = { points: 1250, tier: "Bronze" };
  const orders = [
    { id:"QB-1234", date:"2024-01-15", items:"Caramel Macchiato, Chocolate Chip Cookie", total:7.9, points:39, status:"Completed" },
    { id:"QB-1223", date:"2024-01-12", items:"Iced Coffee, Avocado Toast", total:11.25, points:56, status:"Completed" },
    { id:"QB-1210", date:"2024-01-10", items:"Cappuccino, Croissant Sandwich", total:11.2, points:56, status:"Completed" },
    { id:"QB-1198", date:"2024-01-08", items:"Frappé, Cheesecake", total:10.5, points:52, status:"Completed" },
  ];
  const rewards = [
    { code:"SAVE10", desc:"10% off your next order", exp:"2024-02-15", status:"Available" },
    { code:"FREELATTE", desc:"Free latte with any purchase", exp:"2024-01-30", status:"Available" },
    { code:"BIRTHDAY20", desc:"20% off birthday treat", exp:"2024-03-20", status:"Used" },
  ];

  const nextRewardAt = 1500;
  const pct = Math.min(100, Math.round((loyalty.points/nextRewardAt)*100));

  const displayName  = user?.name  || "Customer";
  const displayEmail = user?.email || "";

  return (
    <section className="profile">
      <div className="banner card">
        <div className="avatar">👤</div>
        <div className="who">
          <strong>{displayName}</strong>
          <div className="muted">
            {displayEmail || "—"} • Member since 2024
          </div>
        </div>
      </div>

      <div className="tabbar">
        {["profile","orders","loyalty","rewards"].map(t=>(
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="profile" && (
        <div className="card p">
          <h3>Personal Information</h3>
          <div className="grid stats">
            <div className="stat"><div className="big">23</div><div className="muted">Total Orders</div></div>
            <div className="stat"><div className="big">$487.5</div><div className="muted">Total Spent</div></div>
            <div className="stat"><div className="big">{loyalty.points}</div><div className="muted">Loyalty Points</div></div>
          </div>
        </div>
      )}

      {tab==="orders" && (
        <div className="card p">
          <h3>Order History</h3>
          <table className="table">
            <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Points</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.date}</td>
                  <td>{o.items}</td>
                  <td>${o.total}</td>
                  <td>+{o.points}</td>
                  <td><span className="badge ok">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="loyalty" && (
        <div className="card p">
          <h3>Loyalty Program</h3>
          <div className="lp-points">{loyalty.points}<span>Current Points</span></div>
          <div className="lp-progress">
            <div className="lp-bar"><span style={{width:`${pct}%`}}/></div>
            <div className="lp-caption">{nextRewardAt - loyalty.points} points to go</div>
          </div>
          <div className="lp-milestones">
            <div><div className="m-icon">☕</div><div className="m-title">500 Points</div><div className="m-note">Free Coffee</div></div>
            <div><div className="m-icon">🎁</div><div className="m-title">1,000 Points</div><div className="m-note">Free Pastry</div></div>
            <div><div className="m-icon">⭐</div><div className="m-title">1,500 Points</div><div className="m-note">Free Meal</div></div>
          </div>
        </div>
      )}

      {tab==="rewards" && (
        <div className="card p">
          <h3>My Reward Codes</h3>
          <p className="muted">Redeem these codes during checkout for special discounts.</p>
          <ul className="rw-list">
            {rewards.map(r=>(
              <li key={r.code} className={`rw ${r.status==="Available"?"ok":"used"}`}>
                <div>
                  <strong>{r.code}</strong>
                  <div className="muted small">{r.desc}<br/>Expires: {r.exp}</div>
                </div>
                <span className={`rw-badge ${r.status==="Available"?"ok":"used"}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
