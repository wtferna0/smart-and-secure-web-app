import React from "react";
import "./about.css";

export default function About(){
  return (
    <section className="about">
      <h1>About QWIK BREW</h1>
      <p className="lead">More than just a café – we’re your neighborhood gathering place where premium coffee meets authentic flavors, creating the perfect atmosphere for work, study, and connection.</p>

      <div className="hero-img card" />

      <h2>Our Story</h2>
      <div className="story">
        <p>Founded in 2020 by coffee enthusiasts, QWIK BREW set out to create a space where exceptional coffee meets authentic Indian flavors and cutting-edge convenience. What started as a cozy neighborhood hub has grown into a beloved community space for students, professionals, and families alike.</p>
        <div className="story-grid">
          <div className="ph card" />
          <div className="ph card" />
          <div className="ph card" />
        </div>
      </div>

      <h2>Our Values</h2>
      <div className="values">
        <div className="card v"><h3>Quality First</h3><p>We source ethically and craft every cup with care.</p></div>
        <div className="card v"><h3>Community Focused</h3><p>We build connections and support our local community.</p></div>
        <div className="card v"><h3>Passion Driven</h3><p>Our team shares a love for exceptional coffee and food.</p></div>
        <div className="card v"><h3>Sustainability</h3><p>We practice eco-friendly sourcing and packaging.</p></div>
      </div>

      <div className="two-col">
        <div className="card contact">
          <h3>Location & Contact</h3>
          <p>123 Innovation Street<br/>Tech District, Downtown</p>
          <p>+91 98765 43210<br/>hello@qwikbrew.com</p>
          <button className="btn btn-primary">Contact Us</button>
        </div>
        <div className="card hours">
          <h3>Hours of Operation</h3>
          <ul>
            <li><span>Mon – Fri</span><span>7:00 AM – 9:00 PM</span></li>
            <li><span>Saturday</span><span>8:00 AM – 9:00 PM</span></li>
            <li><span>Sunday</span><span>8:00 AM – 6:00 PM</span></li>
          </ul>
          <div className="status ok">● Open Now</div>
        </div>
      </div>

      <h2>What We Offer</h2>
      <div className="chips">
        <span>Free High-Speed WiFi</span><span>Free Parking</span><span>Fresh Daily Roasting</span>
        <span>Group Study Areas</span><span>Award-Winning Baristas</span><span>Pet-Friendly Patio</span>
      </div>

      <div className="cta card about-cta">
        <h3>Ready to Experience QWIK BREW?</h3>
        <p>Join our community and discover your new favorite spot.</p>
        <div className="row">
          <a className="btn btn-ghost" href="/menu">View Menu</a>
          <a className="btn btn-primary" href="/play">Play & Win</a>
        </div>
      </div>
    </section>
  );
}
