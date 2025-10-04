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
  }, [isAuthenticated, tab]); // Added tab dependency to refresh when switching tabs

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔄 Fetching latest profile data...');
      
      const response = await fetch(`${API_BASE}/auth/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Profile data received:', userData);
        console.log('💰 Points balance:', userData?.profile?.points_balance);
        setProfileData(userData);
      } else {
        console.log('❌ Failed to fetch profile data');
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('🚨 Failed to fetch profile:', error);
      setError('Failed to load profile data');
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
        
        console.log('✅ Processed orders:', ordersArray.length);
        setOrders(ordersArray);
        
        // Refresh profile data after fetching orders to get updated points
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      } else if (response.status === 401) {
        console.log('❌ Unauthorized - user not logged in or token invalid');
        setOrders([]);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      } else {
        console.log('⚠️ Orders API error status:', response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error('🚨 Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    fetchUserProfile();
    fetchOrders();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const statusMap = {
      'PENDING_PAYMENT': 'pending',
      'PLACED': 'processing',
      'ACCEPTED': 'processing',
      'DONE': 'completed',
      'COMPLETED': 'completed',
      'FAILED': 'cancelled',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'pending';
  };

  // Get status display text
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING_PAYMENT': 'Pending Payment',
      'PLACED': 'Order Placed',
      'ACCEPTED': 'Processing',
      'DONE': 'Ready',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  // Calculate loyalty points and tier from real data
  const calculateLoyaltyData = () => {
    const points = authUser.points_balance || 0;
    console.log('🎯 Calculating loyalty data from points:', points);
    
    let tier = "Bronze";
    if (points >= 1500) tier = "Gold";
    else if (points >= 1000) tier = "Silver";
    
    return { points, tier };
  };

  // Calculate rewards based on loyalty points
  const calculateRewards = () => {
    const points = profileData?.profile?.points_balance || 0;
    console.log('🎁 Calculating rewards for points:', points);
    const rewards = [];

    // Available rewards based on points
    if (points >= 500) {
      rewards.push({
        code: "FREECOFFEE500",
        desc: "Free Coffee (500 Points)",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available"
      });
    }

    if (points >= 1000) {
      rewards.push({
        code: "FREEPANTRY1000",
        desc: "Free Pastry (1000 Points)",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available"
      });
    }

    if (points >= 1500) {
      rewards.push({
        code: "FREEMEAL1500",
        desc: "Free Meal (1500 Points)",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available"
      });
    }

    // If no rewards available, show message
    if (rewards.length === 0) {
      rewards.push({
        code: "EARNMORE",
        desc: `Earn ${500 - points} more points to unlock your first reward`,
        exp: "-",
        status: "Locked"
      });
    }

    return rewards;
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

  // Calculate real data
  const loyalty = calculateLoyaltyData();
  const rewards = calculateRewards();
  
  // Determine next reward threshold
  let nextRewardAt = 500;
  if (loyalty.points >= 500) nextRewardAt = 1000;
  if (loyalty.points >= 1000) nextRewardAt = 1500;
  if (loyalty.points >= 1500) nextRewardAt = 2000; // For future rewards
  
  const pct = Math.min(100, Math.round((loyalty.points / nextRewardAt) * 100));

  // SAFETY CHECK: Ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Calculate totals with array protection
  const totalOrders = safeOrders.length;
  const totalSpent = safeOrders.reduce((sum, order) => {
    const orderTotal = parseFloat(order.total) || 0;
    return sum + orderTotal;
  }, 0);

  // Calculate member since date
  const memberSince = authUser?.date_joined ? new Date(authUser.date_joined).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <section className="profile">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button 
          onClick={refreshData}
          className="btn"
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="banner card">
        <div className="avatar">👤</div>
        <div className="who">
          <strong>{authUser?.first_name || authUser?.username} {authUser?.last_name}</strong>
          <div className="muted">{authUser?.email} • Member since {memberSince}</div>
          <div className="points-display" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            <strong>Loyalty Points: {loyalty.points}</strong> • Tier: {loyalty.tier}
          </div>
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
              <div className="big">LKR {totalSpent.toLocaleString()}</div>
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
            <p><strong>Name:</strong> {authUser?.first_name || 'Not set'} {authUser?.last_name || ''}</p>
            <p><strong>Loyalty Tier:</strong> {loyalty.tier}</p>
            <p><strong>Loyalty Points:</strong> {loyalty.points}</p>
            {profileData?.profile?.phone && (
              <p><strong>Phone:</strong> {profileData.profile.phone}</p>
            )}
            {profileData?.profile?.display_name && (
              <p><strong>Display Name:</strong> {profileData.profile.display_name}</p>
            )}
          </div>
        </div>
      )}

      {tab==="orders" && (
        <div className="card p">
          <h3>Order History</h3>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Points Balance: <strong>{loyalty.points}</strong>
          </div>
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
                  
                  {/* Order Items */}
                  <div className="order-items-section">
                    <h4 className="order-items-title">Items:</h4>
                    <div className="order-items-list">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={index} className="order-item-detail">
                            <div className="item-info">
                              <span className="item-name">{item.item_name || 'Unknown Item'}</span>
                              <span className="item-meta">
                                Qty: {item.qty || 1} × LKR {(parseFloat(item.price_each) || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="item-total">
                              LKR {((parseFloat(item.price_each) || 0) * (item.qty || 1)).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : Array.isArray(order.orderitem_set) && order.orderitem_set.length > 0 ? (
                        order.orderitem_set.map((item, index) => (
                          <div key={index} className="order-item-detail">
                            <div className="item-info">
                              <span className="item-name">{item.item_name || 'Unknown Item'}</span>
                              <span className="item-meta">
                                Qty: {item.qty || 1} × LKR {(parseFloat(item.price_each) || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="item-total">
                              LKR {((parseFloat(item.price_each) || 0) * (item.qty || 1)).toFixed(2)}
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
                        <span>LKR {(parseFloat(order.subtotal) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {order.discount_total > 0 && (
                      <div className="order-summary-line discount">
                        <span>Discount:</span>
                        <span>-LKR {(parseFloat(order.discount_total) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {order.points_redeemed > 0 && (
                      <div className="order-summary-line points">
                        <span>Points Redeemed:</span>
                        <span>- {order.points_redeemed} points</span>
                      </div>
                    )}
                    {order.points_earned > 0 && (
                      <div className="order-summary-line points-earned">
                        <span>Points Earned:</span>
                        <span style={{color: 'green'}}>+ {order.points_earned} points</span>
                      </div>
                    )}
                    <div className="order-summary-line total">
                      <span>Total:</span>
                      <span><strong>LKR {(parseFloat(order.total) || 0).toFixed(2)}</strong></span>
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
            <div className="lp-caption">
              {loyalty.points < 500 ? `${500 - loyalty.points} points to Free Coffee` :
               loyalty.points < 1000 ? `${1000 - loyalty.points} points to Free Pastry` :
               loyalty.points < 1500 ? `${1500 - loyalty.points} points to Free Meal` :
               'All rewards unlocked! Keep earning for future rewards'}
            </div>
          </div>
          <div className="lp-milestones">
            <div className={loyalty.points >= 500 ? "unlocked" : ""}>
              <div className="m-icon">☕</div>
              <div className="m-title">500 Points</div>
              <div className="m-note">Free Coffee</div>
              {loyalty.points >= 500 && <div className="m-badge">Unlocked</div>}
            </div>
            <div className={loyalty.points >= 1000 ? "unlocked" : ""}>
              <div className="m-icon">🎁</div>
              <div className="m-title">1,000 Points</div>
              <div className="m-note">Free Pastry</div>
              {loyalty.points >= 1000 && <div className="m-badge">Unlocked</div>}
            </div>
            <div className={loyalty.points >= 1500 ? "unlocked" : ""}>
              <div className="m-icon">⭐</div>
              <div className="m-title">1,500 Points</div>
              <div className="m-note">Free Meal</div>
              {loyalty.points >= 1500 && <div className="m-badge">Unlocked</div>}
            </div>
          </div>
        </div>
      )}

      {tab==="rewards" && (
        <div className="card p">
          <h3>My Reward Codes</h3>
          <p className="muted">Redeem these codes during checkout for special discounts.</p>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Current Points: <strong>{loyalty.points}</strong>
          </div>
          <ul className="rw-list">
            {rewards.map((r, index) => (
              <li key={index} className={`rw ${r.status === "Available" ? "ok" : r.status === "Locked" ? "locked" : "used"}`}>
                <div>
                  <strong>{r.code}</strong>
                  <div className="muted small">{r.desc}<br/>Expires: {r.exp}</div>
                </div>
                <span className={`rw-badge ${r.status === "Available" ? "ok" : r.status === "Locked" ? "locked" : "used"}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}