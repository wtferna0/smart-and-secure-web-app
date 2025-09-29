import React, { useState } from "react";
import "./contact.css";

export default function Contact(){
  const [form, setForm] = useState({
    name:"", email:"", phone:"", type:"", subject:"", message:""
  });

  function onSubmit(e){
    e.preventDefault();
    alert("Message submitted. We’ll get back to you soon.");
    setForm({ name:"", email:"", phone:"", type:"", subject:"", message:"" });
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <section className="contact">
      <header className="contact-hero card">
        <div className="hero-left">
          <h1>Get in Touch</h1>
          <p className="lead">
            Have a question, suggestion, or just want to say hello?
            We’d love to hear from you.
          </p>
          <div className="tags">
            <span>Support</span><span>Orders</span><span>Events</span><span>Partnerships</span>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* FORM */}
        <form className="card contact-form" onSubmit={onSubmit}>
          <h3>Send us a message</h3>
          <div className="grid-2">
            <label className="field">
              <span className="label">Full Name</span>
              <input required value={form.name} onChange={set("name")} placeholder="Your name" />
            </label>
            <label className="field">
              <span className="label">Email <b className="req">*</b></span>
              <input required type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
            </label>
            <label className="field">
              <span className="label">Phone (optional)</span>
              <input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </label>
            <label className="field">
              <span className="label">Inquiry Type</span>
              <select value={form.type} onChange={set("type")}>
                <option value="">Select a topic</option>
                <option>Orders</option>
                <option>Menu</option>
                <option>Events</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span className="label">Subject</span>
            <input value={form.subject} onChange={set("subject")} placeholder="How can we help?" />
          </label>

          <label className="field">
            <span className="label">Message <b className="req">*</b></span>
            <textarea required rows="5" value={form.message} onChange={set("message")} placeholder="Tell us a bit more..." />
            <span className="hint">We usually respond within 24 hours.</span>
          </label>

          <div className="actions">
            <button className="btn btn-primary">
              <span className="i i-send" aria-hidden="true" /> Send Message
            </button>
            <span className="muted small">By submitting, you agree to be contacted about your inquiry.</span>
          </div>
        </form>

        {/* SIDE INFO */}
        <aside className="card side">
          <h3>Contact Information</h3>
          <ul className="info-list">
            <li><span className="i i-pin" /> 288 Sri Jayawardenepura Mawatha, Sri Jayawardenepura Kotte</li>
            <li><span className="i i-phone" /> (011)1234567</li>
            <li><span className="i i-mail" /> hello@qwikbrew.com</li>
            <li><span className="i i-time" /> Mon–Sun: 9:00 AM – 9:00 PM</li>
          </ul>

          <h4 className="mt">Quick Info</h4>
          <ul className="chips">
            <li>Free Wi-Fi</li>
            <li>Free Parking</li>
            <li>Group Bookings</li>
            <li>Catering Services</li>
          </ul>

          <div className="mini-cta">
            <p>Prefer talking? We’re happy to chat.</p>
            <a className="btn" href="tel:+1555123BREW">Call Now</a>
          </div>
        </aside>
      </div>

      <h2>Frequently Asked Questions</h2>
      <div className="faq">
        {[
          ["Do you offer catering services?",
           "Yes! Contact us to discuss packages and pricing."],
          ["Can I reserve space for private events?",
           "Absolutely—we have areas for private bookings."],
          ["Do you have dietary accommodations?",
           "Yes—ask our staff about dairy-free, gluten-free, and vegan options."],
          ["Is Wi-Fi really free?",
           "Yes, high-speed and unlimited for all customers."],
        ].map(([q,a])=>(
          <details key={q} className="card faq-item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
