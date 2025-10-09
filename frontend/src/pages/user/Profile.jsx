import React, { useState, useEffect } from "react";
import "./profile.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api"; // Import the api module

export default function Profile(){
  const { user: authUser, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [userPromos, setUserPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchOrders();
      if (tab === "rewards") {
        fetchUserPromoCodes();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, tab]);

  const fetchUserProfile = async () => {
    try {
      console.log('🔄 Fetching latest profile data...');
      
      const userData = await api.getCurrentUser();
      console.log('✅ Profile data received:', userData);
      console.log('💰 Points balance:', userData?.profile?.points_balance);
      setProfileData(userData);
    } catch (error) {
      console.error('🚨 Failed to fetch profile:', error);
      setError('Failed to load profile data');
    }
  };

  // In profile.jsx - update the fetchUserPromoCodes function
  const fetchUserPromoCodes = async () => {
    try {
      console.log('🎁 Fetching user promo codes...');
      
      const promosData = await api.getUserPromos();
      console.log('✅ User promo codes API response:', promosData);
      
      // Handle different response formats
      let promosArray = [];
      if (Array.isArray(promosData)) {
        promosArray = promosData;
      } else if (promosData && Array.isArray(promosData.results)) {
        promosArray = promosData.results;
      } else if (promosData && Array.isArray(promosData.data)) {
        promosArray = promosData.data;
      }
      
      console.log('🎫 Processed user promos:', promosArray);
      setUserPromos(promosArray);
    } catch (error) {
      console.error('🚨 Failed to fetch user promo codes:', error);
      setUserPromos([]);
    }
  };

  const fetchOrders = async () => {
    try {
      console.log('🔍 Fetching orders...');
      
      const ordersData = await api.getOrders();
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
    } catch (error) {
      console.error('🚨 Failed to fetch orders:', error);
      setOrders([]);
      if (error.message.includes('401')) {
        console.log('❌ Unauthorized - user not logged in or token invalid');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    fetchUserProfile();
    fetchOrders();
    if (tab === "rewards") {
      fetchUserPromoCodes();
    }
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

  const formatShortDate = (dateString) => {
    if (!dateString || dateString === "No expiry") return 'No expiry';
    if (dateString === "-") return '-';
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

  const getRewardTypeBadge = (reward) => {
    if (reward.is_puzzle_reward) {
      return "🎮 Puzzle";
    }
    if (reward.code && reward.code.startsWith("FREE")) {
      return "⭐ Loyalty";
    }
    return "🎁 Promo";
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
    let points = 0;
    
    if (profileData?.profile?.points_balance !== undefined) {
      points = profileData.profile.points_balance;
      console.log('🎯 Using points from profile data:', points);
    }
    else if (authUser?.points_balance !== undefined) {
      points = authUser.points_balance;
      console.log('🎯 Using points from auth user:', points);
    }
    else {
      const latestPoints = localStorage.getItem('latest_points');
      points = latestPoints ? parseInt(latestPoints) : 0;
      console.log('🎯 Using points from localStorage:', points);
    }
    
    console.log('🎯 Final calculated points:', points);
    
    let tier = "Bronze";
    if (points >= 1500) tier = "Gold";
    else if (points >= 1000) tier = "Silver";
    
    return { points, tier };
  };

  // Calculate rewards based on loyalty points and earned promo codes
  const calculateRewards = () => {
    const points = profileData?.profile?.points_balance || 0;
    console.log('🎁 Calculating rewards for points:', points);
    
    const rewards = [];

    // Add earned promo codes from database - UPDATED to match backend serializer
    userPromos.forEach(userPromo => {
      // Check if we have the promo data in the expected format from backend
      const promoCode = userPromo.promo_code || userPromo.promo?.code;
      const discountType = userPromo.promo_discount_type || userPromo.promo?.discount_type;
      const amount = userPromo.promo_amount || userPromo.promo?.amount;
      
      if (promoCode) {
        // Determine status based on redemption
        const status = userPromo.redeemed_at ? "Used" : "Available";
        
        // Format discount description based on discount_type
        let discountDesc = '';
        if (discountType === 'PERCENT') {
          discountDesc = `${amount}% off`;
        } else if (discountType === 'AMOUNT') {
          discountDesc = `LKR ${parseFloat(amount).toFixed(2)} off`;
        } else {
          discountDesc = `Discount: ${amount}`;
        }
        
        // Get additional promo details if available
        const promo = userPromo.promo || {};
        const minOrderTotal = promo.min_order_total || 0;
        
        // Add minimum order requirement if exists
        if (minOrderTotal && parseFloat(minOrderTotal) > 0) {
          discountDesc += ` (Min order: LKR ${parseFloat(minOrderTotal).toFixed(2)})`;
        }

        rewards.push({
          id: userPromo.id,
          code: promoCode,
          desc: discountDesc,
          exp: promo.end_date ? promo.end_date : "No expiry",
          status: status,
          redeemed_at: userPromo.redeemed_at,
          is_puzzle_reward: userPromo.is_puzzle_reward || promo.is_puzzle_reward,
          discount_type: discountType,
          discount_value: amount,
          min_order_amount: minOrderTotal
        });
      }
    });

    // Add available loyalty rewards based on points (only if not already earned as promo codes)
    const availableRewards = [];
    
    if (points >= 500 && !rewards.some(r => r.code === "FREECOFFEE500")) {
      availableRewards.push({
        id: "free_coffee_500",
        code: "FREECOFFEE500",
        desc: "Free Regular Coffee",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available",
        is_puzzle_reward: false
      });
    }

    if (points >= 1000 && !rewards.some(r => r.code === "FREEPANTRY1000")) {
      availableRewards.push({
        id: "free_pastry_1000",
        code: "FREEPANTRY1000",
        desc: "Free Pastry of Choice",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available",
        is_puzzle_reward: false
      });
    }

    if (points >= 1500 && !rewards.some(r => r.code === "FREEMEAL1500")) {
      availableRewards.push({
        id: "free_meal_1500",
        code: "FREEMEAL1500",
        desc: "Free Meal Combo",
        exp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Available",
        is_puzzle_reward: false
      });
    }

    // Combine earned promo codes with available loyalty rewards
    const allRewards = [...rewards, ...availableRewards];

    // Sort rewards: Available first, then by expiration date
    allRewards.sort((a, b) => {
      const statusOrder = { "Available": 1, "Expired": 2, "Used": 3, "Locked": 4 };
      const statusCompare = statusOrder[a.status] - statusOrder[b.status];
      if (statusCompare !== 0) return statusCompare;
      
      if (a.exp !== b.exp) {
        if (a.exp === "No expiry") return 1;
        if (b.exp === "No expiry") return -1;
        return new Date(a.exp) - new Date(b.exp);
      }
      
      return 0;
    });

    return allRewards;
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
  if (loyalty.points >= 1500) nextRewardAt = 2000;
  
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
                      <div className="order-id">Order #{order.id}</div>
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Current Points: <strong>{loyalty.points}</strong>
              {userPromos.length > 0 && (
                <span style={{ marginLeft: '1rem' }}>
                  Earned Promos: <strong>{userPromos.filter(p => !p.redeemed_at).length} available</strong>
                </span>
              )}
            </div>
            <button 
              onClick={fetchUserPromoCodes}
              className="btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🔄 Refresh Rewards
            </button>
          </div>
          
          <ul className="rw-list">
            {rewards.map((r) => (
              <li key={r.id} className={`rw ${r.status.toLowerCase()}`}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{r.code}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="reward-type-badge">
                        {getRewardTypeBadge(r)}
                      </span>
                      <span className={`rw-badge ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="muted small" style={{ marginBottom: '0.5rem' }}>
                    {r.desc}
                    {r.discount_type && r.status === "Available" && (
                      <div style={{ marginTop: '0.25rem', color: '#666' }}>
                        <strong>Discount:</strong> {r.discount_value}
                        {r.discount_type === 'PERCENT' ? '%' : ' LKR'}
                        {r.min_order_amount && parseFloat(r.min_order_amount) > 0 && (
                          <span> • <strong>Min order:</strong> LKR {parseFloat(r.min_order_amount).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="muted small" style={{ fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>
                      <strong>Expires:</strong> {formatShortDate(r.exp)}
                    </span>
                    {r.redeemed_at && (
                      <span style={{ color: '#ff6b6b' }}>
                        <strong>Redeemed:</strong> {formatShortDate(r.redeemed_at)}
                      </span>
                    )}
                    {r.status === "Expired" && (
                      <span style={{ color: '#ff6b6b' }}>
                        <strong>No longer valid</strong>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {userPromos.length === 0 && rewards.length <= 1 && rewards[0]?.status === "Locked" && (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
              <p><strong>No rewards earned yet</strong></p>
              <p className="muted small" style={{ maxWidth: '400px', margin: '0 auto' }}>
                Complete orders to earn loyalty points, participate in puzzles, or look out for special promotions to unlock exciting rewards!
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <a href="/menu" className="btn btn-primary">Start Shopping</a>
                <a href="/puzzles" className="btn" style={{ marginLeft: '0.5rem', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)' }}>
                  Try Puzzles
                </a>
              </div>
            </div>
          )}
          
          {/* Help section */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.85rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>How to Use Rewards</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666' }}>
              <li>Copy the reward code and enter it during checkout</li>
              <li>Each code can only be used once</li>
              <li>Some rewards may have minimum order requirements</li>
              <li>Expired or used codes cannot be redeemed</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}