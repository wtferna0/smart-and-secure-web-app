import React, { useState } from "react";

export default function Play(){
  const [tries,setTries] = useState(3);
  const [msg,setMsg] = useState("Guess a number 1–5. Win a code!");
  const [won,setWon] = useState(null);

  function guess(n){
    if(tries<=0) return;
    const pick = 1 + Math.floor(Math.random()*5);
    setTries(t=>t-1);
    if(n===pick){ setWon("SAVE10"); setMsg("You won! Code: SAVE10"); }
    else setMsg(`Nope (it was ${pick}). ${tries-1} tries left.`);
  }

  return (
    <section>
      <h1 style={{fontFamily:"var(--font-display)"}}>Play & Win</h1>
      <p className="muted">Just for fun (demo). If you “win”, you’ll see a code here.</p>
      <div className="card" style={{padding:"1rem"}}>
        <div style={{marginBottom:".5rem"}}>{msg}</div>
        <div className="row">
          {[1,2,3,4,5].map(n=><button className="btn" key={n} onClick={()=>guess(n)}>{n}</button>)}
        </div>
        {won && <div className="row" style={{marginTop:".6rem"}}><span className="pill" style={{background:"#efe"}}>Your code: {won}</span></div>}
      </div>
    </section>
  );
}
