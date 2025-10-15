import React, { useEffect, useState } from "react";
import "./home.css";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js";
import { publicApi } from "../lib/api.js";

// Use LKR since your menu is priced for Sri Lanka
const rupee = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, removeFromCart, getItemQuantity } = useCart();

  // 🔹 Crowd state
  const [crowd, setCrowd] = useState({ 
    state: "Quiet", 
    confidence: 0,
    level: 0,
    capacity: 50,
    percentage: 0,
    source: "default",
    updatedAt: null
  });

  // State to track which items are showing quantity controls
  const [activeItems, setActiveItems] = useState({});

  useEffect(() => {
    fetchTrendingItems();
    fetchCrowdData();
  }, []);

  const fetchTrendingItems = async () => {
    try {
      const menuItems = await publicApi.getMenuItems();

      // Use first 3 items as trending for now
      const trendingItems = menuItems.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        image: item.image,
        rating: parseFloat(item.rating) || 4.0,
        tag: "Popular",
        sub: item.category?.name || "Menu Item",
        desc: "Delicious item from our menu.",
        category: item.category?.name,
        stock_qty: item.stock_qty || 0
      }));

      setTrending(trendingItems);
    } catch (error) {
      console.error('Failed to fetch trending items:', error);
      // Fallback to mock data if API fails
      setTrending(getFallbackTrendingItems());
    } finally {
      setLoading(false);
    }
  };

  const fetchCrowdData = async () => {
    try {
      const data = await api.getPredictions();
      console.log("📊 Crowd data received:", data);
      
      // If API returns valid data, use it
      if (data && data.level !== undefined) {
        setCrowd({
          state: data.state || "Quiet",
          confidence: data.confidence || 0,
          level: data.level || 0,
          capacity: data.capacity || 50,
          percentage: data.percentage || 0,
          source: data.source || "ml",
          updatedAt: data.updated_at
        });
      } else {
        // If no data available, show "0 Quiet"
        setCrowd({
          state: "Quiet",
          confidence: 0,
          level: 0,
          capacity: 50,
          percentage: 0,
          source: "default",
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to load crowd data:", err);
      // On error, still show "0 Quiet" as fallback
      setCrowd({ 
        state: "Quiet", 
        confidence: 0,
        level: 0,
        capacity: 50,
        percentage: 0,
        source: "default",
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Handle initial cart button click - shows quantity controls and adds first item
  const handleCartButtonClick = (item) => {
    // Show quantity controls for this item
    setActiveItems(prev => ({
      ...prev,
      [item.id]: true
    }));
    
    // Immediately add one item to cart
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      stock_qty: item.stock_qty,
      image: item.image
    });
  };

  // Handle quantity increase
  const handleIncrease = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      stock_qty: item.stock_qty,
      image: item.image
    });
  };

  // Handle quantity decrease
  const handleDecrease = (item) => {
    removeFromCart(item.id);
    
    // If quantity becomes 0, hide the quantity controls
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity <= 1) {
      setActiveItems(prev => ({
        ...prev,
        [item.id]: false
      }));
    }
  };

  // Fallback data in case API fails
  const getFallbackTrendingItems = () => {
    return [
      {
        id: "masala-chai",
        name: "Masala Chai",
        price: 900,
        image: "/assets/mock/chai.jpg",
        rating: 4.8,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Traditional spiced tea with aromatic herbs and spices.",
      },
      {
        id: "chicken-cutlet",
        name: "Chicken Cutlet",
        price: 220,
        image: "/assets/mock/chicken-cutlet.jpg",
        rating: 4.6,
        tag: "Trending",
        sub: "Short-eats",
        desc: "Crispy golden chicken cutlet with Sri Lankan spices.",
      },
      {
        id: "hot-chocolate",
        name: "Hot Chocolate",
        price: 1100,
        image: "/assets/mock/hotchoc.jpg",
        rating: 4.5,
        tag: "Trending",
        sub: "Hot Beverages",
        desc: "Rich chocolate drink topped with cocoa and warmth.",
      },
    ];
  };

  // Image error handler
  const handleImageError = (e) => {
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
  };

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

        {/* Crowd Meter */}
        <div className="card info">
          <div className="info-head">
            <span className="dot brown">📊</span>
            <h3>Crowd Now</h3>
            {crowd.source !== "error" && (
              <span className="source-tag">{crowd.source}</span>
            )}
          </div>

          {crowd.level > 0 ? (
            <>
              <div className="level">
                <span className={`pill ${crowd.state.toLowerCase()}`}>
                  {crowd.state}
                </span>
                <div className="crowd-count">
                  {crowd.level}/{crowd.capacity}
                </div>
              </div>

              <div className="bar">
                <div
                  style={{
                    width: `${crowd.percentage}%`,
                    height: '100%',
                    backgroundColor: crowd.state === 'Quiet' ? '#10b981' :
                      crowd.state === 'Normal' ? '#f59e0b' :
                        crowd.state === 'Busy' ? '#ef4444' : '#6b7280',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div className="crowd-details">
                <div className="muted small">
                  {crowd.state === "Quiet" && "😌 Plenty of space available"}
                  {crowd.state === "Normal" && "😊 Good atmosphere"}
                  {crowd.state === "Busy" && "😅 Might be crowded"}
                  {crowd.state === "Unknown" && "🔍 Gathering data..."}
                </div>
                {crowd.updatedAt && (
                  <div className="muted x-small">
                    Updated: {new Date(crowd.updatedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="crowd-details">
              <div className="muted small">❓ No data available</div>
            </div>
          )}
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

      {loading ? (
        <div className="loading">Loading trending items...</div>
      ) : (
        <div className="grid-3">
          {trending.map((item) => {
            const isActive = activeItems[item.id];
            const currentQuantity = getItemQuantity(item.id);
            const isOutOfStock = item.stock_qty === 0;
            
            return (
              <article className="item card" key={item.id}>
                <div className="badge">{item.tag}</div>
                <img
                  src={item.image}
                  alt={item.name}
                  className="item-image"
                  onError={handleImageError}
                />
                <div className="item-body">
                  <h3>{item.name}</h3>
                  <div className="sub">{item.sub}</div>
                  <p className="desc">{item.desc}</p>
                  <div className="item-foot">
                    <div className="price">{rupee.format(item.price)}</div>
                    <div className="rating">★ {item.rating}</div>
                  </div>
                  
                  {/* Cart Controls */}
                  {isActive ? (
                    // Quantity Controls (shown after cart button is clicked)
                    <div className="quantity-controls active">
                      <button
                        className="btn btn-quantity minus"
                        onClick={() => handleDecrease(item)}
                        disabled={currentQuantity <= 0}
                      >
                        −
                      </button>
                      <span className="quantity-display">
                        {currentQuantity}
                      </span>
                      <button
                        className="btn btn-quantity plus"
                        onClick={() => handleIncrease(item)}
                        disabled={isOutOfStock}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    // Initial Cart Button (shown by default)
                    <button
                      className="btn add"
                      onClick={() => handleCartButtonClick(item)}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

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