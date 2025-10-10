// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import { api } from '../../lib/api';
import './dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate popular items using your API data
  const calculatePopularItems = (orders, allMenuItems) => {
    const itemCount = {};

    if (orders.length === 0) {
      return [];
    }

    // Process ALL orders to get popular items
    orders.forEach(order => {
      // Check different possible locations for order items
      const orderItems = order.items || order.orderitem_set || [];

      if (orderItems.length > 0) {
        orderItems.forEach(item => {
          const itemName = item.item_name || item.name || 'Unknown Item';
          const quantity = item.qty || 1;

          if (itemName !== 'Unknown Item') {
            itemCount[itemName] = (itemCount[itemName] || 0) + quantity;
          }
        });
      }
    });

    // Convert to array and sort by count
    const popular = Object.entries(itemCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return popular;
  };

  // Calculate today's revenue and orders properly
  const calculateTodaysStats = (orders) => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`💰 Calculating stats for today: ${today}`);

    const todayOrders = orders.filter(order => {
      if (!order.placed_at) return false;

      const orderDate = new Date(order.placed_at).toISOString().split('T')[0];
      const isToday = orderDate === today;

      return isToday;
    });

    console.log(`📊 Found ${todayOrders.length} orders for today`);

    const revenue = todayOrders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.total) || 0;
      return sum + orderTotal;
    }, 0);

    console.log(`💰 Today's Revenue: LKR ${revenue} from ${todayOrders.length} orders`);

    return {
      revenue,
      orderCount: todayOrders.length
    };
  };

  // Fetch real crowd data from your crowd meter API
  const fetchCrowdData = async () => {
    try {
      const data = await api.getCurrentCrowd();
      setCrowdData(data);
      console.log('👥 Real crowd data:', data);
    } catch (err) {
      console.error('❌ Crowd API error:', err);
      // Set fallback if crowd API fails
      setCrowdData({
        level: 0,
        source: 'system',
        updated_at: new Date().toISOString()
      });
    }
  };

  // Get crowd status description
  const getCrowdStatus = (level) => {
    if (level < 15) return "Quiet";
    if (level < 31) return "Normal";
    return "Busy";
  };

  // Get crowd status color
  const getCrowdStatusColor = (level) => {
    if (level < 15) return "#28a745"; // Green for Quiet
    if (level < 31) return "#ffc107"; // Yellow for Normal
    return "#dc3545"; // Red for Busy
  };

  // Get source badge color
  const getSourceColor = (source) => {
    switch (source) {
      case 'ml': return '#17a2b8'; // Info blue
      case 'manual': return '#fd7e14'; // Orange
      default: return '#6c757d'; // Gray
    }
  };

  // Fetch dashboard data using your API functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 STARTING dashboard data fetch...');

      // Fetch all data in parallel
      const [ordersData, menuData] = await Promise.all([
        api.getAdminOrders().catch(err => {
          console.error('❌ Orders API error:', err);
          return [];
        }),
        api.getMenuItems().catch(err => {
          console.error('❌ Menu items API error:', err);
          return [];
        })
      ]);

      console.log('📊 Orders received:', ordersData.length);
      console.log('🍽️ Menu items received:', menuData.length);

      const orders = Array.isArray(ordersData) ? ordersData : [];
      const allMenuItems = Array.isArray(menuData) ? menuData : [];

      setRecentOrders(orders.slice(0, 8));
      setMenuItems(allMenuItems);

      // Calculate today's stats FIRST
      const todayStats = calculateTodaysStats(orders);

      // Calculate other stats
      const statusCount = {
        New: 0,
        Preparing: 0,
        Ready: 0,
        Completed: 0
      };

      orders.forEach(order => {
        if (order.status === "PENDING_PAYMENT" || order.status === "PLACED") statusCount.New++;
        if (order.status === "ACCEPTED") statusCount.Preparing++;
        if (order.status === "DONE") statusCount.Ready++;
        if (order.status === "COMPLETED") statusCount.Completed++;
      });

      const calculatedStats = {
        total_orders: orders.length,
        today_revenue: todayStats.revenue,
        today_orders: todayStats.orderCount,
        active_customers: [...new Set(orders.map(order =>
          order.customer?.username || order.guest_email
        ).filter(Boolean))].length,
        total_products: allMenuItems.length,
        low_stock_items: allMenuItems.filter(item => item.stock_qty < 10).length,
        pending_orders: orders.filter(order =>
          ['PENDING_PAYMENT', 'PLACED'].includes(order.status)
        ).length,
        status_count: statusCount,
        total_revenue: orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
      };

      setStats(calculatedStats);

      // Calculate popular items from ALL orders
      const popularItemsData = calculatePopularItems(orders, allMenuItems);
      setPopularItems(popularItemsData);

      // Fetch real-time crowd data
      await fetchCrowdData();

    } catch (error) {
      console.error('❌ Dashboard data fetch error:', error);
      setError(`Unable to load dashboard data: ${error.message}`);

      // Set empty data
      setRecentOrders([]);
      setMenuItems([]);
      setPopularItems([]);
      setCrowdData({
        level: 0,
        source: 'system',
        updated_at: new Date().toISOString()
      });
      setStats({
        total_orders: 0,
        today_revenue: 0,
        today_orders: 0,
        active_customers: 0,
        total_products: 0,
        low_stock_items: 0,
        pending_orders: 0,
        status_count: { New: 0, Preparing: 0, Ready: 0, Completed: 0 },
        total_revenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fallback demo data in case no orders exist
  const fallbackPopularItems = [
    { name: "Caramel Macchiato", count: 23 },
    { name: "Iced Coffee", count: 19 },
    { name: "Cappuccino", count: 17 },
    { name: "Chocolate Chip Cookie", count: 15 },
    { name: "Avocado Toast", count: 12 }
  ];

  // Determine which data to display
  const displayPopularItems = popularItems.length > 0 ? popularItems :
    stats.total_orders > 0 ? [{ name: "No item data available", count: 0 }] :
      fallbackPopularItems;

  if (loading) {
    return (
      <section className="admin">
        <AdminTabs />
        <div className="loading">Loading Dashboard...</div>
      </section>
    );
  }

  return (
    <section className="admin">
      <AdminTabs />
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Dashboard</h1>

      {error && (
        <div className="error-message p">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid kpis" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card kpi" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Orders Today</span>
            <strong style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.today_orders || 0}
            </strong>
          </div>
        </div>

        <div className="card kpi" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Revenue Today</span>
            <strong style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              LKR {(stats.today_revenue || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="card kpi" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Active Orders</span>
            <strong style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.pending_orders || 0}
            </strong>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              {stats.pending_orders === 1 ? '1 order pending' : `${stats.pending_orders || 0} orders pending`}
            </div>
          </div>
        </div>

        {/* Real Crowd Status Card */}
        <div className="card kpi" style={{
          textAlign: 'center',
          padding: '1.5rem',
          borderLeft: `4px solid ${getCrowdStatusColor(crowdData?.level || 0)}`
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Current Crowd</span>
            <strong style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getCrowdStatusColor(crowdData?.level || 0)
            }}>
              {crowdData?.level || 0} people
            </strong>
            <div style={{
              fontSize: '0.8rem',
              opacity: 0.7,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{getCrowdStatus(crowdData?.level || 0)}</span>
              <span style={{
                background: getSourceColor(crowdData?.source),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {crowdData?.source?.toUpperCase() || 'SYSTEM'}
              </span>
            </div>
            {crowdData?.updated_at && (
              <div style={{
                fontSize: '0.7rem',
                opacity: 0.5
              }}>
                Updated: {new Date(crowdData.updated_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid admin-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Order Status Distribution */}
        <div className="card p" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Order Status Distribution</h3>
          <ul className="legend" style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ff6b6b'
              }} />
              New: {stats.status_count?.New || 0}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#4ecdc4'
              }} />
              Preparing: {stats.status_count?.Preparing || 0}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#45b7d1'
              }} />
              Ready: {stats.status_count?.Ready || 0}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#96ceb4'
              }} />
              Completed: {stats.status_count?.Completed || 0}
            </li>
          </ul>
        </div>

        {/* Popular Items Today */}
        <div className="card p" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Popular Items</h3>
          <ol className="popular" style={{
            paddingLeft: '1.5rem',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {displayPopularItems.map((item, index) => (
              <li key={index} style={{ padding: '0.25rem 0' }}>
                {item.name}
                {item.count > 0 && ` — ${item.count} order${item.count !== 1 ? 's' : ''}`}
                {popularItems.length === 0 && stats.total_orders === 0 && " (demo)"}
              </li>
            ))}
          </ol>
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.7,
            marginTop: '1rem',
            textAlign: 'center'
          }}>
            {popularItems.length > 0 ? (
              `Based on ${stats.total_orders} total orders`
            ) : stats.total_orders > 0 ? (
              "Order items data not available in API response"
            ) : (
              "* Showing demo data (no orders in system)"
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="card p" style={{
          padding: '1.5rem',
          gridColumn: 'span 2'
        }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Recent Orders</h3>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '600px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Order ID</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? recentOrders.map((order) => {
                  const orderDate = order.placed_at ? new Date(order.placed_at).toLocaleDateString() : 'N/A';
                  const isToday = order.placed_at && order.placed_at.startsWith(new Date().toISOString().split('T')[0]);

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {order.id}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {order.customer?.username || order.guest_email || 'Guest'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          background:
                            order.status === 'PENDING_PAYMENT' || order.status === 'PLACED' ? '#fff3cd' :
                              order.status === 'ACCEPTED' ? '#d1ecf1' :
                                order.status === 'DONE' ? '#d4edda' :
                                  order.status === 'COMPLETED' ? '#d4edda' : '#f8d7da',
                          color:
                            order.status === 'PENDING_PAYMENT' || order.status === 'PLACED' ? '#856404' :
                              order.status === 'ACCEPTED' ? '#0c5460' :
                                order.status === 'DONE' ? '#155724' :
                                  order.status === 'COMPLETED' ? '#155724' : '#721c24'
                        }}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                        LKR {parseFloat(order.total || 0).toLocaleString()}
                        {isToday && <span style={{ color: '#28a745', fontSize: '0.7rem', marginLeft: '0.5rem' }}>Today</span>}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', opacity: 0.7 }}>
                        {orderDate}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.7 }}>
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={fetchDashboardData}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </section>
  );
};

export default Dashboard;