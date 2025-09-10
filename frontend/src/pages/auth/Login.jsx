import React, { useState } from "react";
import "./auth.css";

export default function Login(){
  const [tab, setTab] = useState("signin");
  const [f,setF] = useState({ name:"", email:"", password:"" });

  function submit(e){
    e.preventDefault();
    alert((tab==="signin"?"Signed in":"Account created")+" (placeholder).");
  }

  return (
    <section>
      <h1>Welcome to Brew & Bytes</h1>
      <div className="tabs">
        <button className={tab==="signin"?"active":""} onClick={()=>setTab("signin")}>Sign in</button>
        <button className={tab==="signup"?"active":""} onClick={()=>setTab("signup")}>Sign up</button>
      </div>

      <form className="auth-form card" onSubmit={submit}>
        {tab==="signup" && (<label>Name<input required value={f.name} onChange={e=>setF({...f, name:e.target.value})}/></label>)}
        <label>Email<input type="email" required value={f.email} onChange={e=>setF({...f, email:e.target.value})}/></label>
        <label>Password<input type="password" required value={f.password} onChange={e=>setF({...f, password:e.target.value})}/></label>
        <button className="btn btn-primary">{tab==="signin"?"Sign In":"Create account"}</button>
        <p className="muted">Demo credentials: any email and password</p>
      </form>
    </section>
  );
}
