import React, { useMemo, useState } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";

const SEED = [
  { img:"/src/assets/mock/latte.svg", name:"Espresso", desc:"Rich, bold shot of our signature espresso...", cat:"Hot Beverages", price:2.95, stock:50, status:"Available" },
  { img:"/src/assets/mock/latte.svg", name:"Cappuccino", desc:"Perfect balance of espresso, steamed milk...", cat:"Hot Beverages", price:4.25, stock:45, status:"Available" },
  { img:"/src/assets/mock/bagel.svg", name:"Iced Coffee", desc:"Smooth cold brew served over ice...", cat:"Cold Beverages", price:3.75, stock:40, status:"Available" },
  { img:"/src/assets/mock/brownie.svg", name:"Chocolate Cake", desc:"Rich, moist chocolate cake with ganache ...", cat:"Cakes", price:4.50, stock:8,  status:"Available", badge:"Low" },
  { img:"/src/assets/mock/brownie.svg", name:"Chocolate Chip Cookies", desc:"Freshly baked premium chocolate chip...", cat:"Cookies", price:2.95, stock:0,  status:"Unavailable", badge:"Out" },
  { img:"/src/assets/mock/bagel.svg", name:"Avocado Toast", desc:"Smashed avocado on artisan sourdough ...", cat:"Short-eats", price:7.50, stock:10, status:"Available" },
];

export default function AdminMenuStock(){
  const [items, setItems] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);   // { ...item, idx }
  const [adding, setAdding] = useState(false);

  const totals = useMemo(()=>({
    total: items.length,
    available: items.filter(i=>i.status==="Available").length,
    low: items.filter(i=>i.badge==="Low").length,
    out: items.filter(i=>i.badge==="Out").length,
  }),[items]);

  function onEdit(idx){
    setDraft({ ...items[idx], idx });
    setAdding(false);
    setOpen(true);
  }
  function onAdd(){
    setDraft({ img:"/src/assets/mock/latte.svg", name:"", desc:"", cat:"Hot Beverages", price:0, stock:0, status:"Available" });
    setAdding(true);
    setOpen(true);
  }
  function onDelete(idx){
    if(confirm(`Delete "${items[idx].name}"?`)){
      setItems(prev => prev.filter((_,i)=>i!==idx));
    }
  }
  function onSave(e){
    e.preventDefault();
    const clean = {
      img: draft.img,
      name: draft.name || "Untitled",
      desc: draft.desc || "",
      cat: draft.cat || "Hot Beverages",
      price: Number(draft.price)||0,
      stock: Number(draft.stock)||0,
      status: draft.status || "Available",
      badge: draft.stock<=0 ? "Out" : (draft.stock<=10 ? "Low" : undefined)
    };
    setItems(prev=>{
      if(adding) return [clean, ...prev];
      const next=[...prev]; next[draft.idx]=clean; return next;
    });
    setOpen(false);
  }

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Menu & Stock Management</h1>
      <p className="muted">Manage menu items, prices, categories, and stock levels.</p>

      <div className="grid kpis">
        <div className="card kpi"><span>Total Items</span><strong>{totals.total}</strong></div>
        <div className="card kpi"><span>Available</span><strong>{totals.available}</strong></div>
        <div className="card kpi"><span>Low Stock</span><strong>{totals.low}</strong></div>
        <div className="card kpi"><span>Out of Stock</span><strong>{totals.out}</strong></div>
      </div>

      <div className="row" style={{marginBottom:"10px"}}>
        <button className="btn btn-primary" onClick={onAdd}>＋ Add Item</button>
      </div>

      <div className="card tbl">
        <h3>Menu Items ({items.length})</h3>
        <table className="table">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((it,i)=>(
              <tr key={i}>
                <td>
                  <div className="row" style={{alignItems:"center", gap:".6rem"}}>
                    <img src={it.img} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>
                    <div><strong>{it.name}</strong><div className="muted small">{it.desc}</div></div>
                  </div>
                </td>
                <td><span className="pill">{it.cat}</span></td>
                <td>${it.price.toFixed(2)}</td>
                <td>{it.stock} {it.badge && <span className={`badge ${it.badge==="Out"?"bad":""}`}>{it.badge}</span>}</td>
                <td className={it.status==="Unavailable"?"bad":""}>{it.status}</td>
                <td>
                  <button className="btn btn-ghost" onClick={()=>onEdit(i)}>✏️</button>
                  <button className="btn btn-ghost" onClick={()=>onDelete(i)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={adding?"Add Menu Item":"Edit Menu Item"} onClose={()=>setOpen(false)}>
        {draft && (
          <form onSubmit={onSave}>
            <label>Image URL
              <input value={draft.img} onChange={e=>setDraft(d=>({...d, img:e.target.value}))}/>
            </label>
            <label>Name
              <input required value={draft.name} onChange={e=>setDraft(d=>({...d, name:e.target.value}))}/>
            </label>
            <label>Description
              <textarea rows="3" value={draft.desc} onChange={e=>setDraft(d=>({...d, desc:e.target.value}))}/>
            </label>
            <label>Category
              <select value={draft.cat} onChange={e=>setDraft(d=>({...d, cat:e.target.value}))}>
                {["Hot Beverages","Cold Beverages","Cakes","Cookies","Short-eats"].map(c=><option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Price (USD)
              <input type="number" step="0.01" value={draft.price} onChange={e=>setDraft(d=>({...d, price:e.target.value}))}/>
            </label>
            <label>Stock
              <input type="number" value={draft.stock} onChange={e=>setDraft(d=>({...d, stock:e.target.value}))}/>
            </label>
            <label>Status
              <select value={draft.status} onChange={e=>setDraft(d=>({...d, status:e.target.value}))}>
                <option>Available</option>
                <option>Unavailable</option>
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
