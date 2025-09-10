import React from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";

const hours = Array.from({length:15},(_,i)=>7+i); // 7AM..9PM
const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const cell = (state)=>({ label: state, pct: state==="Quiet"?"25%":state==="Normal"?"50%":"80%", className: state.toLowerCase() });

export default function AdminCrowd(){
  return (
    <section className="admin">
      <AdminTabs />
      <h1>Crowd Meter Management</h1>
      <p className="muted">Configure expected crowd levels to help customers plan their visits.</p>

      <div className="grid kpis">
        <div className="card kpi"><span>Quiet Periods</span><strong>35</strong></div>
        <div className="card kpi"><span>Normal Periods</span><strong>32</strong></div>
        <div className="card kpi"><span>Busy Periods</span><strong>38</strong></div>
        <div className="card kpi"><span>Peak Capacity</span><strong>85%</strong></div>
      </div>

      <div className="card crowd">
        <h3>Weekly Crowd Schedule</h3>
        <div className="crowd-grid">
          <div className="cg-head" />
          {days.map(d=><div key={d} className="cg-head">{d}</div>)}
          {hours.map(h=>(
            <React.Fragment key={h}>
              <div className="cg-y">{(h>12?h-12:h)} {h<12?"AM":"PM"}</div>
              {days.map(d=>{
                const s = (h%3===0) ? cell("Busy") : (h%2===0 ? cell("Normal") : cell("Quiet"));
                return <button key={d+h} className={`cg-cell ${s.className}`}>{s.label}<br/><span className="muted small">{s.pct}</span></button>;
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="legend-row">
          <span className="dot quiet" /> Quiet (≤30%) <span className="dot normal" /> Normal (31–70%) <span className="dot busy" /> Busy (71%+)
        </div>
      </div>
    </section>
  );
}
