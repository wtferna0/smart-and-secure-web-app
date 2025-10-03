import React, { useState, useEffect } from "react";
import "./profile.css";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Profile(){
  const { user: authUser, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = 'https://cafe-app.duckdns.org/api';

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/auth/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setProfileData(userData);
      } else {
        console.log('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('No authentication token found');
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching orders with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE}/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Orders API response status:', response.status);
      
      if (response.ok) {
        const ordersData = await response.json();
        console.log('📦 Raw orders API response:', ordersData);
        
        // Handle different response formats
        let ordersArray = [];
        if (Array.isArray(ordersData)) {
          ordersArray = ordersData;
        } else if (ordersData && Array.isArray(ordersData.results)) {
          ordersArray = ordersData.results;
        } else if (ordersData && Array.isArray(ordersData.data)) {
          ordersArray = ordersData.data;
        }
        
        console.log('✅ Processed orders:', ordersArray);
        setOrders(ordersArray);
      } else if (response.status === 401) {
        console.log('❌ Unauthorized - user not logged in or token invalid');
        setOrders([]);
        // Optionally logout the user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      } else {
        console.log('⚠️ Orders API error status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setOrders([]);
      }
    } catch (error) {
      console.error('🚨 Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced mock data with safety
  const getMockOrders = () => {
    return [
      { 
        id: 1, 
        order_token: "QB-1234", 
        status: "fulfilled", 
        total: "15.00", 
        subtotal: "15.00",
        placed_at: "2024-01-15T10:30:00Z",
        items: [
          { item_name: "Affogato (Espresso + Ice Cream)", qty: 1, price_each: "15.00" }
        ]
      },
      { 
        id: 2, 
        order_token: "QB-1223", 
        status: "paid", 
        total: "12.50", 
        subtotal: "12.50",
        placed_at: "2024-01-12T14:20:00Z",
        items: [
          { item_name: "Cafe Latte", qty: 1, price_each: "4.50" },
          { item_name: "Chocolate Chip Cookie", qty: 2, price_each: "4.00" }
        ]
      }
    ];
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const statusMap = {
      'pending_payment': 'pending',
      'paid': 'processing',
      'fulfilled': 'completed',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
  };

  // Get status display text
  const getStatusText = (status) => {
    const statusMap = {
      'pending_payment': 'Pending Payment',
      'paid': 'Processing',
      'fulfilled': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <section className="profile">
        <div className="card p" style={{textAlign: 'center', padding: '3rem'}}>
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your profile and order history.</p>
          <div style={{marginTop: '1rem'}}>
            <a href="/login" className="btn btn-primary">Log In</a>
            <a href="/signup" className="btn" style={{marginLeft: '0.5rem'}}>Sign Up</a>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="profile">
        <div className="loading">Loading your profile...</div>
      </section>
    );
  }

  // SAFETY CHECK: Ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Use real data from backend with safety checks
  const loyalty = { 
    points: profileData?.profile?.points_balance || 0, 
    tier: (profileData?.profile?.points_balance >= 1500 ? "Gold" : profileData?.profile?.points_balance >= 1000 ? "Silver" : "Bronze")
  };
  
  const rewards = [
    { code:"SAVE10", desc:"10% off your next order", exp:"2024-02-15", status:"Available" },
    { code:"FREELATTE", desc:"Free latte with any purchase", exp:"2024-01-30", status:"Available" },
    { code:"BIRTHDAY20", desc:"20% off birthday treat", exp:"2024-03-20", status:"Used" },
  ];
  
  const nextRewardAt = 1500;
  const pct = Math.min(100, Math.round((loyalty.points/nextRewardAt)*100));

  // SAFETY CHECK: Calculate totals with array protection
  const totalOrders = safeOrders.length;
  const totalSpent = safeOrders.reduce((sum, order) => {
    const orderTotal = parseFloat(order.total) || 0;
    return sum + orderTotal;
  }, 0);

  return (
    <section className="profile">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="banner card">
        <div className="avatar">👤</div>
        <div className="who">
          <strong>{authUser?.first_name} {authUser?.last_name}</strong>
          <div className="muted">{authUser?.email} • Member since {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="tabbar">
        {["profile","orders","loyalty","rewards"].map(t=>(
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="profile" && (
        <div className="card p">
          <h3>Personal Information</h3>
          <div className="grid stats">
            <div className="stat">
              <div className="big">{totalOrders}</div>
              <div className="muted">Total Orders</div>
            </div>
            <div className="stat">
              <div className="big">${totalSpent.toFixed(2)}</div>
              <div className="muted">Total Spent</div>
            </div>
            <div className="stat">
              <div className="big">{loyalty.points}</div>
              <div className="muted">Loyalty Points</div>
            </div>
          </div>
          
          <div className="profile-details" style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee'}}>
            <h4>Account Details</h4>
            <p><strong>Username:</strong> {authUser?.username}</p>
            <p><strong>Email:</strong> {authUser?.email}</p>
            <p><strong>Name:</strong> {authUser?.first_name} {authUser?.last_name}</p>
            <p><strong>Loyalty Tier:</strong> {loyalty.tier}</p>
            {profileData?.profile?.phone && (
              <p><strong>Phone:</strong> {profileData.profile.phone}</p>
            )}
          </div>
        </div>
      )}

      {tab==="orders" && (
        <div className="card p">
          <h3>Order History</h3>
          {safeOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders found.</p>
              <p className="muted small">Orders placed while logged in will appear here.</p>
              <a href="/menu" className="btn btn-primary" style={{marginTop: '1rem'}}>Start Shopping</a>
            </div>
          ) : (
            <div className="orders-list">
              {safeOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-main-info">
                      <div className="order-id">Order #{order.order_token}</div>
                      <div className="order-date">{formatDate(order.placed_at)}</div>
                    </div>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  {/* Order Items - Enhanced Display */}
                  <div className="order-items-section">
                    <h4 className="order-items-title">Items:</h4>
                    <div className="order-items-list">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={index} className="order-item-detail">
                            <div className="item-info">
                              <span className="item-name">{item.item_name || item.menu_item_name}</span>
                              <span className="item-meta">
                                Qty: {item.qty} × ${(parseFloat(item.price_each) || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="item-total">
                              ${((parseFloat(item.price_each) || 0) * (item.qty || 1)).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-items">No items found for this order</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="order-summary">
                    {order.subtotal > 0 && (
                      <div className="order-summary-line">
                        <span>Subtotal:</span>
                        <span>${(parseFloat(order.subtotal) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {order.discount_total > 0 && (
                      <div className="order-summary-line discount">
                        <span>Discount:</span>
                        <span>-${(parseFloat(order.discount_total) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="order-summary-line total">
                      <span>Total:</span>
                      <span><strong>${(parseFloat(order.total) || 0).toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="loyalty" && (
        <div className="card p">
          <h3>Loyalty Program</h3>
          <div className="lp-points">{loyalty.points}<span>Current Points</span></div>
          <div className="lp-progress">
            <div className="lp-bar"><span style={{width:`${pct}%`}}/></div>
            <div className="lp-caption">{nextRewardAt - loyalty.points} points to go</div>
          </div>
          <div className="lp-milestones">
            <div><div className="m-icon">☕</div><div className="m-title">500 Points</div><div className="m-note">Free Coffee</div></div>
            <div><div className="m-icon">🎁</div><div className="m-title">1,000 Points</div><div className="m-note">Free Pastry</div></div>
            <div><div className="m-icon">⭐</div><div className="m-title">1,500 Points</div><div className="m-note">Free Meal</div></div>
          </div>
        </div>
      )}

      {tab==="rewards" && (
        <div className="card p">
          <h3>My Reward Codes</h3>
          <p className="muted">Redeem these codes during checkout for special discounts.</p>
          <ul className="rw-list">
            {rewards.map(r=>(
              <li key={r.code} className={`rw ${r.status==="Available"?"ok":"used"}`}>
                <div><strong>{r.code}</strong><div className="muted small">{r.desc}<br/>Expires: {r.exp}</div></div>
                <span className={`rw-badge ${r.status==="Available"?"ok":"used"}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}