import React, { useEffect, useState } from "react";
import "./home.css";
import { useCart } from "../context/CartContext.jsx";

// Use LKR since your menu is priced for Sri Lanka
const rupee = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [trending, setTrending] = useState([]);
  const { add } = useCart(); // ← fixed destructuring on one line

  useEffect(() => {
    setTrending([
      {
        id: "masala-chai",
        name: "Masala Chai",
        price: 900,
        img: "/src/assets/mock/chai.jpg",
        rating: 4.8,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Traditional spiced tea with aromatic herbs and spices.",
      },
      {
        id: "Chicken-cutlet",
        name: "Chicken Cutlet",
        price: 220,
        img: "/src/assets/mock/chicken-cutlet.jpg",
        rating: 4.6,
        tag: "Trending",
        sub: "Short-eats",
        desc: "Crispy golden fish cutlet with Sri Lankan spices.",
      },
      {
        id: "hot-chocolate",
        name: "Hot Chocolate",
        price: 1100,
        img: "/src/assets/mock/hotchoc.jpg",
        rating: 4.5,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Rich chocolate drink topped with cocoa and warmth.",
      },
    ]);
  }, []);

  return (
    <section className="home">
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

      <div className="info-row">
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

        <div className="card info">
          <div className="info-head">
            <span className="dot brown">📊</span>
            <h3>Crowd Now</h3>
          </div>
          <div className="level">
            <span className="pill">Normal</span>
          </div>
          <div className="bar">
            <span style={{ width: "55%" }} />
          </div>
          <div className="muted small">Good atmosphere</div>
        </div>

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
