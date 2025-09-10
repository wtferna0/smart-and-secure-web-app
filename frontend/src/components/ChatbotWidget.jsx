import React, { useState } from "react";
import "./ChatbotWidget.css";

export default function ChatbotWidget(){
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="bot-btn" onClick={()=>setOpen(v=>!v)}>💬</button>
      {open && (
        <div className="bot-card card">
          <div className="bot-head">
            <strong>BrewBot</strong>
            <button className="btn" onClick={()=>setOpen(false)}>✕</button>
          </div>
          <div className="bot-body">
            <p><em>Hi! Ask me about menu, loyalty, or crowd levels.</em></p>
            <div className="muted small">Demo widget only.</div>
          </div>
        </div>
      )}
    </>
  );
}
