import React, { useState, useEffect } from "react";
import "./menu.css";
import { publicApi } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";

const DJANGO_URL = 'https://cafe-app.duckdns.org';

// Simple image fallbacks
const defaultImages = {
  coffee: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
  tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
  dessert: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop",
  cookie: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
};

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const [categoriesData, itemsData] = await Promise.all([
          publicApi.getMenuCategories(),
          publicApi.getMenuItems()
        ]);

        // Safe data processing
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        const safeItems = Array.isArray(itemsData) ? itemsData : [];

        setCategories(safeCategories);
        setItems(safeItems);

      } catch (err) {
        console.error("Menu loading error:", err);
        setError("Failed to load menu data");
        setCategories([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Safe data
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeItems = Array.isArray(items) ? items : [];

  // Safe filtering
  const filteredItems = safeItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item?.category?.id?.toString() === selectedCategory;
    const matchesSearch = item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Apply sorting
  const sortedItems = [...filteredItems];
  if (sort === "price-asc") sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === "price-desc") sortedItems.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === "name") sortedItems.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Get total items count for display
  const totalItemsCount = sortedItems.length;
  const activeCategoryName = selectedCategory === "all"
    ? "All Categories"
    : safeCategories.find(cat => cat.id.toString() === selectedCategory)?.name || "Selected Category";

  if (loading) {
    return (
      <section className="menu">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading delicious menu...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="menu">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="menu">
      {/* Header Section */}
      <div className="menu-top">
        <h1>{totalItemsCount} items in {activeCategoryName}</h1>
        <label className="sort">
          Sorted by&nbsp;
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      <div className="menu-layout">
        {/* Categories Sidebar */}
        <aside className="cat-panel card">
          <h3>Categories</h3>
          <ul>
            <li>
              <button
                className={`cat-pill ${selectedCategory === "all" ? 'active' : ''}`}
                onClick={() => setSelectedCategory("all")}
              >
                🌟 All Items
              </button>
            </li>
            {safeCategories.map(category => (
              <li key={category.id}>
                <button
                  className={`cat-pill ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id.toString())}
                >
                  {getCategoryIcon(category.name)} {category.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Search Box */}
          <div className="search-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search your favorite items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="menu-items">
            {sortedItems.length > 0 ? (
              <div className="items-grid">
                {sortedItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <h3>No items found</h3>
                <p>We couldn't find any items matching your search.</p>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="btn btn-secondary"
                  >
                    Show All Items
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Menu Item Card Component - UPDATED with quantity controls
function MenuItemCard({ item }) {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const [imageError, setImageError] = useState(false);
  const [showQuantityControls, setShowQuantityControls] = useState(false);

  const stockQty = item?.stock_qty || 0;
  const currentQuantity = getItemQuantity(item.id);
  const availableQty = Math.max(0, stockQty - currentQuantity);
  const isOutOfStock = availableQty === 0;

  // Handle initial cart button click
  const handleCartButtonClick = () => {
    if (!isOutOfStock) {
      setShowQuantityControls(true);
      addToCart({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category?.name,
        stock_qty: stockQty,
        image: item.image,
      });
    }
  };

  // Handle quantity increase
  const handleIncrease = () => {
    if (availableQty > 0) {
      addToCart({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        category: item.category?.name,
        stock_qty: stockQty,
        image: item.image,
      });
    }
  };

  // Handle quantity decrease
  const handleDecrease = () => {
    removeFromCart(item.id);
    if (currentQuantity <= 1) {
      setShowQuantityControls(false);
    }
  };

  // Simple image handling
  const getItemImage = () => {
    if (item.image && !imageError) {
      return item.image;
    }

    const categoryName = item?.category?.name?.toLowerCase() || '';
    if (categoryName.includes('coffee')) return defaultImages.coffee;
    if (categoryName.includes('tea')) return defaultImages.tea;
    if (categoryName.includes('cake') || categoryName.includes('dessert')) return defaultImages.dessert;
    if (categoryName.includes('cookie')) return defaultImages.cookie;
    if (categoryName.includes('bakery') || categoryName.includes('pastry')) return defaultImages.bakery;
    return defaultImages.default;
  };

  return (
    <article className="menu-card card">
      <div className="item-image-container">
        <img
          src={getItemImage()}
          alt={item.name}
          className="item-image"
          onError={() => setImageError(true)}
        />
        {isOutOfStock && (
          <div className="chip out-of-stock">Out of Stock</div>
        )}
      </div>

      <div className="mc-body">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <h4>{item.name}</h4>
        </div>
        <div className="muted small">
          {item.category?.name}
        </div>
        <div className="row mc-foot">
          <div className="price">$ {parseFloat(item.price || 0).toFixed(2)}</div>
          
          {/* Cart Controls */}
          {showQuantityControls ? (
            // Quantity Controls (shown after cart button is clicked)
            <div className="quantity-controls active">
              <button
                className="btn btn-quantity minus"
                onClick={handleDecrease}
                disabled={currentQuantity <= 0}
              >
                −
              </button>
              <span className="quantity-display">
                {currentQuantity}
              </span>
              <button
                className="btn btn-quantity plus"
                onClick={handleIncrease}
                disabled={isOutOfStock}
              >
                +
              </button>
            </div>
          ) : (
            // Initial Cart Button (shown by default)
            <button
              className={`btn add ${isOutOfStock ? 'disabled' : ''}`}
              onClick={handleCartButtonClick}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Out of Stock' : '🛒 Add'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Helper function for category icons
function getCategoryIcon(categoryName) {
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('coffee')) return '☕';
  if (name.includes('tea')) return '🍵';
  if (name.includes('cake') || name.includes('dessert')) return '🍰';
  if (name.includes('cookie')) return '🍪';
  if (name.includes('bakery') || name.includes('pastry')) return '🥐';
  if (name.includes('beverage') || name.includes('drink')) return '🥤';
  return '🍽️';
}