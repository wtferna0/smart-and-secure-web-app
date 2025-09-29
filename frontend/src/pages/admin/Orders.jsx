import React, { useMemo, useState } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";

const STAGES = ["New","Accepted","Ready","Completed"];

export default function AdminOrders(){
  const [orders, setOrders] = useState([
    { id:"A001", customer:"Guest",   items:2, total: 7.50, stage:"Accepted" },
    { id:"A002", customer:"Sarah J", items:1, total: 3.75, stage:"New" },
  ]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState(null);

  const counts = useMemo(()=>(
    STAGES.map(s => orders.filter(o=>o.stage===s).length)
  ),[orders]);

  function onAdd(){
    setDraft({ id:`A${(100 + Math.floor(Math.random()*900)).toString()}`, customer:"", items:1, total:0, stage:"New" });
    setAdding(true); setOpen(true);
  }
  function onEdit(o){
    setDraft({...o}); setAdding(false); setOpen(true);
  }
  function onDelete(id){
    if(confirm(`Delete order ${id}?`)){
      setOrders(prev=>prev.filter(o=>o.id!==id));
    }
  }
  function move(o, dir){
    const idx = STAGES.indexOf(o.stage);
    const nextStage = STAGES[Math.max(0, Math.min(STAGES.length-1, idx + dir))];
    setOrders(prev => prev.map(x => x.id===o.id ? {...x, stage: nextStage} : x));
  }
  function onSave(e){
    e.preventDefault();
    const clean = {
      id: draft.id || `A${Date.now()}`,
      customer: draft.customer || "Guest",
      items: Number(draft.items)||1,
      total: Number(draft.total)||0,
      stage: draft.stage || "New",
    };
    setOrders(prev=>{
      const exists = prev.some(o=>o.id===clean.id);
      if(adding || !exists) return [clean, ...prev];
      return prev.map(o=>o.id===clean.id ? clean : o);
    });
    setOpen(false);
  }

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Order Management</h1>
      <p className="muted">Add, edit or move orders between stages.</p>

      <div className="grid order-stages">
        {STAGES.map((st, i)=>(
          <div key={st} className={`stage s-${st.toLowerCase()}`}>
            <div className="stage-head">
              {st} <span className="bubble">{counts[i]}</span>
            </div>
            <div className="stage-box" style={{textAlign:"left"}}>
              {orders.filter(o=>o.stage===st).length===0 ? (
                <div className="muted">No orders in this stage</div>
              ) : (
                orders.filter(o=>o.stage===st).map(o=>(
                  <div key={o.id} className="row" style={{justifyContent:"space-between", marginBottom:"8px"}}>
                    <div>
                      <strong>{o.id}</strong> • {o.customer}
                      <div className="small muted">{o.items} items • ${o.total.toFixed(2)}</div>
                    </div>
                    <div className="row">
                      <button className="btn" onClick={()=>move(o,-1)}>←</button>
                      <button className="btn" onClick={()=>move(o, 1)}>→</button>
                      <button className="btn btn-ghost" onClick={()=>onEdit(o)}>✏️</button>
                      <button className="btn btn-ghost" onClick={()=>onDelete(o.id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card summary">
        <h3>Today’s Order Summary</h3>
        <div className="sum-grid">
          <div><div className="big">{orders.length}</div><div className="muted">Total Orders</div></div>
          <div><div className="big">{counts[0]}</div><div className="muted">Pending</div></div>
          <div><div className="big">{counts[1]+counts[2]}</div><div className="muted">In Progress</div></div>
          <div><div className="big">{counts[3]}</div><div className="muted">Completed</div></div>
        </div>
      </div>

      <div className="row" style={{marginTop:"8px"}}>
        <button className="btn btn-primary" onClick={onAdd}>＋ New Order</button>
      </div>

      <Modal open={open} title={adding?"New Order":"Edit Order"} onClose={()=>setOpen(false)}>
        {draft && (
          <form onSubmit={onSave}>
            <label>Order ID
              <input value={draft.id} onChange={e=>setDraft(d=>({...d, id:e.target.value}))}/>
            </label>
            <label>Customer
              <input value={draft.customer} onChange={e=>setDraft(d=>({...d, customer:e.target.value}))}/>
            </label>
            <label>Items
              <input type="number" value={draft.items} onChange={e=>setDraft(d=>({...d, items:e.target.value}))}/>
            </label>
            <label>Total (USD)
              <input type="number" step="0.01" value={draft.total} onChange={e=>setDraft(d=>({...d, total:e.target.value}))}/>
            </label>
            <label>Stage
              <select value={draft.stage} onChange={e=>setDraft(d=>({...d, stage:e.target.value}))}>
                {STAGES.map(s=><option key={s}>{s}</option>)}
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
