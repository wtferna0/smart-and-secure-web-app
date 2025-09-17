import React, { useMemo, useState } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";

const SEED = [
  { name:"Sarah Johnson",  email:"sarah.johnson@email.com", phone:"(555) 987-6543", joined:"15/01/2024", points:1250, spent:487.50, orders:23, tier:"Gold",     status:"Active" },
  { name:"Michael Chen",   email:"m.chen@email.com",        phone:"(555) 123-4567", joined:"03/11/2023", points:2750, spent:892.30, orders:45, tier:"Platinum", status:"Active" },
  { name:"Emily Rodriguez",email:"emily@email.com",         phone:"(555) 456-7890", joined:"10/02/2024", points:450,  spent:156.75, orders:8,  tier:"Bronze",   status:"Active" },
  { name:"David Kim",      email:"davidk@email.com",        phone:"(555) 789-0123", joined:"15/12/2023", points:825,  spent:324.60, orders:16, tier:"Silver",   status:"Inactive" },
  { name:"Jessica Brown",  email:"j.brown@email.com",       phone:"(555) 234-5678", joined:"20/09/2023", points:1890, spent:645.80, orders:32, tier:"Gold",     status:"Active" },
  { name:"Alex Wilson",    email:"alex.wilson@email.com",   phone:"(555) 345-6789", joined:"01/01/2024", points:0,    spent:45.50,  orders:2,  tier:"Bronze",   status:"Suspended" },
];

export default function AdminUsers(){
  const [rows, setRows] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);

  const totals = useMemo(()=>({
    users: rows.length,
    active: rows.filter(u=>u.status==="Active").length,
    points: rows.reduce((s,u)=>s+u.points,0),
    revenue: rows.reduce((s,u)=>s+u.spent,0)
  }),[rows]);

  function onEdit(i){ setDraft({ ...rows[i], idx:i }); setAdding(false); setOpen(true); }
  function onAdd(){ setDraft({ name:"", email:"", phone:"", joined:"", points:0, spent:0, orders:0, tier:"Bronze", status:"Active" }); setAdding(true); setOpen(true); }
  function onSave(e){
    e.preventDefault();
    const clean = {
      name: draft.name||"Unnamed",
      email: draft.email||"",
      phone: draft.phone||"",
      joined: draft.joined||"",
      points: Number(draft.points)||0,
      spent: Number(draft.spent)||0,
      orders: Number(draft.orders)||0,
      tier: draft.tier||"Bronze",
      status: draft.status||"Active",
    };
    setRows(prev=>{
      if(adding) return [clean, ...prev];
      const next=[...prev]; next[draft.idx]=clean; return next;
    });
    setOpen(false);
  }

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

      <div className="row" style={{marginBottom:"10px"}}>
        <button className="btn btn-primary" onClick={onAdd}>＋ Add User</button>
      </div>

      <div className="card tbl">
        <h3>Users ({rows.length})</h3>
        <table className="table">
          <thead><tr><th>User</th><th>Contact</th><th>Loyalty</th><th>Tier</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((u,i)=>(
              <tr key={i}>
                <td><strong>{u.name}</strong><div className="muted small">Joined {u.joined}</div></td>
                <td>{u.email}<br/>{u.phone}</td>
                <td>{u.points} pts<br/>${u.spent.toFixed(2)} • {u.orders} orders</td>
                <td><span className="pill">{u.tier}</span></td>
                <td><span className={`badge ${u.status==="Active"?"ok":u.status==="Inactive"?"warn":"bad"}`}>{u.status}</span></td>
                <td><button className="btn btn-ghost" onClick={()=>onEdit(i)}>✏️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={adding?"Add User":"Edit User"} onClose={()=>setOpen(false)}>
        {draft && (
          <form onSubmit={onSave}>
            <label>Name<input value={draft.name} onChange={e=>setDraft(d=>({...d, name:e.target.value}))}/></label>
            <label>Email<input value={draft.email} onChange={e=>setDraft(d=>({...d, email:e.target.value}))}/></label>
            <label>Phone<input value={draft.phone} onChange={e=>setDraft(d=>({...d, phone:e.target.value}))}/></label>
            <label>Joined (DD/MM/YYYY)<input value={draft.joined} onChange={e=>setDraft(d=>({...d, joined:e.target.value}))}/></label>
            <label>Points<input type="number" value={draft.points} onChange={e=>setDraft(d=>({...d, points:e.target.value}))}/></label>
            <label>Spent (USD)<input type="number" step="0.01" value={draft.spent} onChange={e=>setDraft(d=>({...d, spent:e.target.value}))}/></label>
            <label>Orders<input type="number" value={draft.orders} onChange={e=>setDraft(d=>({...d, orders:e.target.value}))}/></label>
            <label>Tier
              <select value={draft.tier} onChange={e=>setDraft(d=>({...d, tier:e.target.value}))}>
                <option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option>
              </select>
            </label>
            <label>Status
              <select value={draft.status} onChange={e=>setDraft(d=>({...d, status:e.target.value}))}>
                <option>Active</option><option>Inactive</option><option>Suspended</option>
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
