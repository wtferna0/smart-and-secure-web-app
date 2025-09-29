import React, { useEffect, useState } from "react";
import "./home.css";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js"; // added for crowd meter

// Use LKR since your menu is priced for Sri Lanka
const rupee = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [trending, setTrending] = useState([]);
  const { add } = useCart();

  // 🔹 Crowd state
  const [crowd, setCrowd] = useState({ state: "Loading...", confidence: 0 });

  useEffect(() => {
    // Trending items
    setTrending([
      {
        id: "masala-chai",
        name: "Masala Chai",
        price: 900,
        img: "/assets/mock/chai.jpg",
        rating: 4.8,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Traditional spiced tea with aromatic herbs and spices.",
      },
      {
        id: "Chicken-cutlet",
        name: "Chicken Cutlet",
        price: 220,
        img: "/assets/mock/chicken-cutlet.jpg",
        rating: 4.6,
        tag: "Trending",
        sub: "Short-eats",
        desc: "Crispy golden fish cutlet with Sri Lankan spices.",
      },
      {
        id: "hot-chocolate",
        name: "Hot Chocolate",
        price: 1100,
        img: "/assets/mock/hotchoc.jpg",
        rating: 4.5,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Rich chocolate drink topped with cocoa and warmth.",
      },
    ]);

    // 🔹 Fetch crowd predictions from backend
    api.getPredictions()
      .then((data) => {
        // expected backend response: { state: "Normal", confidence: 0.55 }
        setCrowd({
          state: data.state,
          confidence: data.confidence,
        });
      })
      .catch((err) => {
        console.error("Failed to load crowd data:", err);
        setCrowd({ state: "Unknown", confidence: 0 });
      });
  }, []);

  return (
    <section className="home">
      {/* Hero Section */}
      <div className="hero card">
        <div className="hero-copy">
          <h1>Welcome to QWIK BREW</h1>
          <p>
            Your neighborhood café serving premium coffee, authentic snacks, and
            a cozy atmosphere perfect for work or relaxation.
          </p>
          <div className="row">
            <a className="btn btn-primary" href="/menu">
              ☕&nbsp;Order Now
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true" />
      </div>

      {/* Info Row */}
      <div className="info-row">
        {/* Hours */}
        <div className="card info">
          <div className="info-head">
            <span className="dot red">⏱</span>
            <h3>Hours Today</h3>
          </div>
          <div className="info-cols">
            <div>
              <div className="muted">Open</div>
              <div>7:00 AM</div>
            </div>
            <div>
              <div className="muted">Close</div>
              <div>9:00 PM</div>
            </div>
          </div>
          <div className="status ok">● Open Now</div>
        </div>

        {/* 🔹 Crowd Meter */}
        <div className="card info">
          <div className="info-head">
            <span className="dot brown">📊</span>
            <h3>Crowd Now</h3>
          </div>
          <div className="level">
            <span className={`pill ${crowd.state.toLowerCase()}`}>
              {crowd.state}
            </span>
          </div>
          <div className="bar">
            <span style={{ width: `${crowd.confidence * 100}%` }} />
          </div>
          <div className="muted small">
            {crowd.state === "Quiet" && "Plenty of space available"}
            {crowd.state === "Normal" && "Good atmosphere"}
            {crowd.state === "Busy" && "Might be crowded"}
            {crowd.state === "Unknown" && "No data available"}
            {crowd.state === "Loading..." && "Fetching live data..."}
          </div>
        </div>

        {/* Amenities */}
        <div className="card info">
          <div className="info-head">
            <span className="dot blue">📶</span>
            <h3>Amenities</h3>
          </div>
          <ul className="amen-list">
            <li>Free WiFi</li>
            <li>Prime Location</li>
            <li>Fresh Daily</li>
          </ul>
        </div>
      </div>

      {/* Trending Items */}
      <div className="trending-head">
        <h2 className="section-title">
          <span className="twinkle">✦</span> Trending Items
        </h2>
        <a className="btn btn-ghost small" href="/menu">
          View Full Menu
        </a>
      </div>

      <div className="grid-3">
        {trending.map((item) => (
          <article className="item card" key={item.id}>
            <div className="badge">{item.tag}</div>
            <img src={item.img} alt={item.name} />
            <div className="item-body">
              <h3>{item.name}</h3>
              <div className="sub">{item.sub}</div>
              <p className="desc">{item.desc}</p>
              <div className="item-foot">
                <div className="price">{rupee.format(item.price)}</div>
                <div className="rating">★ {item.rating}</div>
              </div>
              <button
                className="btn add"
                onClick={() =>
                  add({ id: item.id, name: item.name, price: item.price })
                }
              >
                🛒 Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="cta card">
        <h3>Ready to Order?</h3>
        <p>
          Browse our full menu of premium coffee, authentic snacks, and
          delicious treats.
        </p>
        <div className="row">
          <a className="btn btn-primary" href="/menu">
            Browse Menu
          </a>
          <a className="btn btn-ghost" href="/play">
            Play &amp; Win Rewards
          </a>
        </div>
      </div>
    </section>
  );
}
