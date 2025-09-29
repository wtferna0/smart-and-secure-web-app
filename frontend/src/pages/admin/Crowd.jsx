import React, { useState } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";

const hours = Array.from({length:15},(_,i)=>7+i); // 7AM..9PM
const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const NEXT = { Quiet:"Normal", Normal:"Busy", Busy:"Quiet" };

export default function AdminCrowd(){
  // seed grid with a pattern; store as { [dayIndex-hour]: "Quiet" | "Normal" | "Busy" }
  const makeSeed=()=> {
    const seed={};
    hours.forEach(h=>{
      days.forEach((_,d)=>{
        seed[`${d}-${h}`] = (h%3===0) ? "Busy" : (h%2===0 ? "Normal" : "Quiet");
      });
    });
    return seed;
  };
  const [grid, setGrid] = useState(makeSeed());

  const counts = Object.values(grid).reduce((a,s)=>{ a[s] = (a[s]||0)+1; return a; }, { Quiet:0, Normal:0, Busy:0 });

  function toggle(d,h){
    const key=`${d}-${h}`;
    setGrid(prev=>({ ...prev, [key]: NEXT[prev[key]] }));
  }

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Crowd Meter Management</h1>
      <p className="muted">Click a cell to cycle Quiet → Normal → Busy. This is local state (ready for API save).</p>

      <div className="grid kpis">
        <div className="card kpi"><span>Quiet Periods</span><strong>{counts.Quiet}</strong></div>
        <div className="card kpi"><span>Normal Periods</span><strong>{counts.Normal}</strong></div>
        <div className="card kpi"><span>Busy Periods</span><strong>{counts.Busy}</strong></div>
        <div className="card kpi"><span>Peak Capacity</span><strong>—</strong></div>
      </div>

      <div className="card crowd">
        <h3>Weekly Crowd Schedule</h3>
        <div className="crowd-grid">
          <div className="cg-head" />
          {days.map(d=><div key={d} className="cg-head">{d}</div>)}
          {hours.map(h=>(
            <React.Fragment key={h}>
              <div className="cg-y">{(h>12?h-12:h)} {h<12?"AM":"PM"}</div>
              {days.map((_,di)=>{
                const key=`${di}-${h}`;
                const state = grid[key];
                return (
                  <button
                    key={key}
                    className={`cg-cell ${state.toLowerCase()}`}
                    onClick={()=>toggle(di,h)}
                    title="Click to change"
                  >
                    {state}<br/><span className="muted small">
                      {state==="Quiet"?"25%":state==="Normal"?"50%":"80%"}
                    </span>
                  </button>
                );
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
