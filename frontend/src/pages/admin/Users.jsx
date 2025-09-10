import React from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";

const users = [
  { name:"Sarah Johnson", email:"sarah.johnson@email.com", phone:"(555) 987-6543", joined:"15/01/2024", points:1250, spent:487.50, orders:23, tier:"Gold", status:"Active" },
  { name:"Michael Chen", email:"m.chen@email.com", phone:"(555) 123-4567", joined:"03/11/2023", points:2750, spent:892.30, orders:45, tier:"Platinum", status:"Active" },
  { name:"Emily Rodriguez", email:"emily@email.com", phone:"(555) 456-7890", joined:"10/02/2024", points:450, spent:156.75, orders:8, tier:"Bronze", status:"Active" },
  { name:"David Kim", email:"davidk@email.com", phone:"(555) 789-0123", joined:"15/12/2023", points:825, spent:324.60, orders:16, tier:"Silver", status:"Inactive" },
  { name:"Jessica Brown", email:"j.brown@email.com", phone:"(555) 234-5678", joined:"20/09/2023", points:1890, spent:645.80, orders:32, tier:"Gold", status:"Active" },
  { name:"Alex Wilson", email:"alex.wilson@email.com", phone:"(555) 345-6789", joined:"01/01/2024", points:0, spent:45.50, orders:2, tier:"Bronze", status:"Suspended" },
];

export default function AdminUsers(){
  const totals = { users: users.length, active: users.filter(u=>u.status==="Active").length, points: users.reduce((s,u)=>s+u.points,0), revenue: users.reduce((s,u)=>s+u.spent,0) };
  return (
    <section className="admin">
      <AdminTabs />
      <h1>User & Loyalty Management</h1>
      <p className="muted">Manage customer accounts, loyalty points, and user privileges.</p>

      <div className="grid kpis">
        <div className="card kpi"><span>Total Users</span><strong>{totals.users}</strong></div>
        <div className="card kpi"><span>Active Users</span><strong>{totals.active}</strong></div>
        <div className="card kpi"><span>Total Points</span><strong>{totals.points.toLocaleString()}</strong></div>
        <div className="card kpi"><span>Total Revenue</span><strong>${totals.revenue.toFixed(2)}</strong></div>
      </div>

      <div className="card tbl">
        <h3>Users ({users.length})</h3>
        <table className="table">
          <thead><tr><th>User</th><th>Contact</th><th>Loyalty</th><th>Tier</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={i}>
                <td><strong>{u.name}</strong><div className="muted small">Joined {u.joined}</div></td>
                <td>{u.email}<br/>{u.phone}</td>
                <td>{u.points} pts<br/>${u.spent.toFixed(2)} • {u.orders} orders</td>
                <td><span className="pill">{u.tier}</span></td>
                <td><span className={`badge ${u.status==="Active"?"ok":u.status==="Inactive"?"warn":"bad"}`}>{u.status}</span></td>
                <td><button className="btn btn-ghost">✏️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card tiers">
        <h3>Loyalty Tier System</h3>
        <div className="tier-grid">
          <div className="tier bronze"><strong>Bronze</strong><div>0 – 499 points<br/>5% discount</div></div>
          <div className="tier silver"><strong>Silver</strong><div>500 – 999 points<br/>10% discount</div></div>
          <div className="tier gold"><strong>Gold</strong><div>1000 – 2499 points<br/>15% discount</div></div>
          <div className="tier platinum"><strong>Platinum</strong><div>2500+ points<br/>20% discount</div></div>
        </div>
      </div>
    </section>
  );
}
