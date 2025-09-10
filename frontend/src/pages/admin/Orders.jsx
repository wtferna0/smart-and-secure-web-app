import React from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";

export default function AdminOrders(){
  const counts = [0,0,0,0];
  return (
    <section className="admin">
      <AdminTabs />
      <h1>Order Management</h1>
      <p className="muted">Manage orders from placement to completion with real-time updates.</p>

      <div className="grid order-stages">
        <div className="stage s-new"><div className="stage-head">New Orders <span className="bubble">{counts[0]}</span></div><div className="stage-box">No orders in this stage</div></div>
        <div className="stage s-acc"><div className="stage-head">Accepted <span className="bubble">{counts[1]}</span></div><div className="stage-box">No orders in this stage</div></div>
        <div className="stage s-ready"><div className="stage-head">Ready <span className="bubble">{counts[2]}</span></div><div className="stage-box">No orders in this stage</div></div>
        <div className="stage s-done"><div className="stage-head">Completed <span className="bubble">{counts[3]}</span></div><div className="stage-box">No orders in this stage</div></div>
      </div>

      <div className="card summary">
        <h3>Today’s Order Summary</h3>
        <div className="sum-grid">
          <div><div className="big">0</div><div className="muted">Total Orders</div></div>
          <div><div className="big">0</div><div className="muted">Pending</div></div>
          <div><div className="big">0</div><div className="muted">In Progress</div></div>
          <div><div className="big">0</div><div className="muted">Completed</div></div>
        </div>
      </div>
    </section>
  );
}
