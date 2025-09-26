import React, { useState } from "react";
import "./dashboard.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";

export default function AdminDashboard() {
  const [orders] = useState([
    { id:"A001", user:"Guest", total:2650, status:"Accepted" },
    { id:"A002", user:"sarah@qwik", total:1550, status:"Pending" },
  ]);
  const crowd = [450,600,750,900,1050,1200,800]; // demo

  const statusCount = { New:0, Preparing:0, Ready:0, Completed:0 };
  orders.forEach(o => {
    if (o.status === "Pending") statusCount.New++;
    if (o.status === "Accepted") statusCount.Preparing++;
    if (o.status === "Done") statusCount.Completed++;
  });

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Admin Dashboard</h1>

      {/* KPIs */}
      <div className="grid kpis">
        <div className="card kpi"><div className="kpi-top"><span>Orders Today</span><strong>0</strong></div></div>
        <div className="card kpi"><div className="kpi-top"><span>Revenue Today</span><strong>$0.00</strong></div></div>
        <div className="card kpi"><div className="kpi-top"><span>Active Orders</span><strong>{orders.length}</strong></div></div>
        <div className="card kpi"><div className="kpi-top"><span>Crowd Level</span><strong>Normal</strong></div></div>
      </div>

      {/* Main panels */}
      <div className="grid admin-grid">
        {/* Make Weekly Performance stretch across the full row */}
        <div className="card p span-2">
          <h3>Weekly Performance</h3>
          <div className="bars">
            {crowd.map((v,i)=>(
              <div key={i} className="bar">
                <div className="fill" style={{height:`${v/6}px`}} />
                <span className="bar-x">{"SMTWTFS"[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p">
          <h3>Order Status Distribution</h3>
          <ul className="legend">
            <li><span className="dot d1" /> New: {statusCount.New}</li>
            <li><span className="dot d2" /> Preparing: {statusCount.Preparing}</li>
            <li><span className="dot d3" /> Ready: {statusCount.Ready}</li>
            <li><span className="dot d4" /> Completed: {statusCount.Completed}</li>
          </ul>
        </div>

        <div className="card p">
          <h3>Popular Items Today</h3>
          <ol className="popular">
            <li>Caramel Macchiato — 23 orders</li>
            <li>Iced Coffee — 19 orders</li>
            <li>Cappuccino — 17 orders</li>
            <li>Chocolate Chip Cookie — 15 orders</li>
            <li>Avocado Toast — 12 orders</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
