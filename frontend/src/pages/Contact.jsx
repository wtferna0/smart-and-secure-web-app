import React, { useState } from "react";
import "./contact.css";

export default function Contact(){
  const [form, setForm] = useState({ name:"", email:"", phone:"", type:"", subject:"", message:"" });
  function onSubmit(e){
    e.preventDefault();
    alert("Message submitted. We’ll get back to you soon.");
    setForm({ name:"", email:"", phone:"", type:"", subject:"", message:"" });
  }
  return (
    <section className="contact">
      <h1>Get in Touch</h1>
      <p className="lead">Have a question or suggestion? We’d love to hear from you.</p>

      <div className="layout">
        <form className="card contact-form" onSubmit={onSubmit}>
          <label>Name<input required value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/></label>
          <label>Email*<input required type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))}/></label>
          <label>Phone (Optional)<input value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))}/></label>
          <label>Inquiry Type
            <select value={form.type} onChange={e=>setForm(f=>({...f, type:e.target.value}))}>
              <option value="">Select a topic</option>
              <option>Orders</option><option>Menu</option><option>Events</option><option>Other</option>
            </select>
          </label>
          <label>Subject<input value={form.subject} onChange={e=>setForm(f=>({...f, subject:e.target.value}))}/></label>
          <label>Message<textarea required rows="5" value={form.message} onChange={e=>setForm(f=>({...f, message:e.target.value}))}/></label>
          <button className="btn btn-primary">✉️ Send Message</button>
        </form>

        <aside className="card side">
          <h3>Contact Information</h3>
          <ul>
            <li>📍 123 Innovation Street</li>
            <li>📞 (555) 123-BREW</li>
            <li>✉️ hello@qwikbrew.com</li>
            <li>🕒 Mon-Sun: 7:00 AM – 9:00 PM</li>
          </ul>
          <h4>Quick Info</h4>
          <ul className="bullets">
            <li>Free WiFi Available</li>
            <li>Free Parking</li>
            <li>Group Bookings Welcome</li>
            <li>Catering Services</li>
          </ul>
        </aside>
      </div>

      <h2>Frequently Asked Questions</h2>
      <div className="faq">
        {[
          ["Do you offer catering services?","Yes! Contact us for packages."],
          ["Can I reserve space for private events?","Absolutely—we have areas for private bookings."],
          ["Do you have dietary accommodations?","Yes—ask our staff about options."],
          ["Is WiFi really free?","Yes, high-speed and unlimited."],
        ].map(([q,a])=>(
          <details key={q} className="card">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
