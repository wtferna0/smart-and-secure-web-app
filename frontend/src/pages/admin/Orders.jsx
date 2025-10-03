import React, { useState, useEffect } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";
import { api } from "../../lib/api.js";

const STATUS_MAPPING = {
  'PENDING_PAYMENT': 'New',
  'PLACED': 'New', 
  'ACCEPTED': 'Accepted',
  'DONE': 'Ready',
  'COMPLETED': 'Completed'
};

const BACKEND_STATUS_MAPPING = {
  'New': 'ACCEPTED',        // New → Accepted
  'Accepted': 'DONE',       // Accepted → Ready  
  'Ready': 'COMPLETED',     // Ready → Completed
  'Completed': 'COMPLETED'  // Completed stays Completed
};

const UI_STAGES = ["New", "Accepted", "Ready", "Completed"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set()); // Track expanded orders

  useEffect(() => {
    fetchOrders();
  }, []);

  const getCustomerDisplayName = (order) => {
    if (order.customer && typeof order.customer === 'object') {
      const { first_name, last_name, username, email } = order.customer;
      if (first_name) return first_name;
      const fullName = `${first_name || ''} ${last_name || ''}`.trim();
      if (fullName) return fullName;
      if (username) return username;
      if (email) return email.split('@')[0];
      return 'Customer';
    }
    if (order.customer && typeof order.customer === 'number') {
      return `User #${order.customer}`;
    }
    if (order.guest_email) {
      const guestName = order.guest_email.split('@')[0];
      return `Guest (${guestName})`;
    }
    return 'Guest';
  };

  const getCustomerEmail = (order) => {
    if (order.customer && typeof order.customer === 'object') {
      return order.customer.email;
    }
    return order.guest_email || '';
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await api.getAdminOrders();
      
      if (!ordersData) {
        throw new Error("No data received from server");
      }

      const filteredOrders = ordersData
        .filter(order => order && !['FAILED', 'CANCELLED'].includes(order.status))
        .map(order => {
          const customerName = getCustomerDisplayName(order);
          const customerEmail = getCustomerEmail(order);
          
          const uiOrder = {
            id: order.id,
            order_token: order.order_token,
            status: order.status,
            uiStatus: STATUS_MAPPING[order.status] || 'New',
            customer_name: customerName,
            customer_email: customerEmail,
            items_count: 0,
            total_amount: parseFloat(order.total) || 0,
            subtotal: parseFloat(order.subtotal) || 0,
            discount_total: parseFloat(order.discount_total) || 0,
            guest_email: order.guest_email || '',
            placed_at: order.placed_at,
            updated_at: order.updated_at,
            customer: order.customer,
            items: order.items || order.orderitem_set || []
          };

          if (uiOrder.items && Array.isArray(uiOrder.items)) {
            uiOrder.items_count = uiOrder.items.reduce((sum, item) => sum + (item.qty || 0), 0);
          }

          return uiOrder;
        });
      
      setOrders(filteredOrders);
      
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError(`Failed to load orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const moveOrder = async (order, direction) => {
    try {
      const currentStageIndex = UI_STAGES.indexOf(order.uiStatus);
      const nextStageIndex = Math.max(0, Math.min(UI_STAGES.length - 1, currentStageIndex + direction));
      const nextUIStatus = UI_STAGES[nextStageIndex];
      const nextBackendStatus = BACKEND_STATUS_MAPPING[nextUIStatus];

      console.log('🔄 Status Update Debug:');
      console.log('Current UI Status:', order.uiStatus);
      console.log('Current Backend Status:', order.status);
      console.log('Next UI Status:', nextUIStatus);
      console.log('Next Backend Status:', nextBackendStatus);
      console.log('Direction:', direction);

      setOrders(prev => prev.map(o => 
        o.id === order.id ? { 
          ...o, 
          status: nextBackendStatus,
          uiStatus: nextUIStatus 
        } : o
      ));

      const result = await api.updateOrderStatus(order.id, nextBackendStatus);
      console.log('✅ API Response:', result);
      
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { 
          ...o, 
          status: order.status,
          uiStatus: order.uiStatus 
        } : o
      ));
      alert("Failed to update order status: " + error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await api.updateOrderStatus(orderId, 'CANCELLED');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order");
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (draft) {
      alert("Order creation via admin panel is complex and requires menu items. Use the main ordering system instead.");
      setOpen(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const counts = UI_STAGES.map(stage => 
    orders.filter(order => order.uiStatus === stage).length
  );

  const totalOrders = orders.length;
  const pendingOrders = counts[0];
  const inProgressOrders = counts[1] + counts[2];
  const completedOrders = counts[3];

  if (loading) return <div className="admin"><AdminTabs /><p>Loading orders...</p></div>;
  if (error) return <div className="admin"><AdminTabs /><p className="bad">{error}</p></div>;

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Order Management</h1>
      <p className="muted">Manage and track customer orders. Showing {orders.length} orders.</p>

      <div className="grid order-stages">
        {UI_STAGES.map((stage, index) => (
          <div key={stage} className={`stage s-${stage.toLowerCase()}`}>
            <div className="stage-head">
              {stage} <span className="bubble">{counts[index]}</span>
            </div>
            <div className="stage-box">
              {orders.filter(order => order.uiStatus === stage).length === 0 ? (
                <div className="muted">No orders in this stage</div>
              ) : (
                orders.filter(order => order.uiStatus === stage).map(order => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div 
                      key={order.id} 
                      className={`order-item ${isExpanded ? 'expanded' : ''}`}
                    >
                      {/* Minimal View (always visible) */}
                      <div 
                        className="order-summary"
                        onClick={() => toggleOrderExpansion(order.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="order-basic-info">
                          <strong className="order-number">#{order.order_token}</strong>
                          <div className="order-customer">{order.customer_name}</div>
                          <div className="order-total">${order.total_amount.toFixed(2)}</div>
                        </div>
                        <div className="order-expand-icon">
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>

                      {/* Expanded Details (only when clicked) */}
                      {isExpanded && (
                        <div className="order-details-expanded">
                          <div className="order-detail-row">
                            <span className="detail-label">Customer:</span>
                            <span className="detail-value">{order.customer_name}</span>
                          </div>
                          {order.customer_email && (
                            <div className="order-detail-row">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">{order.customer_email}</span>
                            </div>
                          )}
                          <div className="order-detail-row">
                            <span className="detail-label">Items:</span>
                            <span className="detail-value">{order.items_count} items</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="order-items-preview">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="order-item-line">
                                  {item.item_name} ×{item.qty}
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="order-more-items">
                                  +{order.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          )}
                          <div className="order-detail-row">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">
                              {new Date(order.placed_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          <div className="order-actions-expanded">
                            <button 
                              className="btn btn-small" 
                              onClick={() => moveOrder(order, -1)}
                              disabled={index === 0}
                              title="Move left"
                            >
                              ←
                            </button>
                            <button 
                              className="btn btn-small" 
                              onClick={() => moveOrder(order, 1)}
                              disabled={index === UI_STAGES.length - 1}
                              title="Move right"
                            >
                              →
                            </button>
                            <button 
                              className="btn btn-small btn-ghost" 
                              onClick={() => openOrderDetails(order)}
                              title="View details"
                            >
                              👁️
                            </button>
                            <button 
                              className="btn btn-small btn-ghost" 
                              onClick={() => deleteOrder(order.id)}
                              title="Cancel order"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card summary">
        <h3>Order Summary</h3>
        <div className="sum-grid">
          <div>
            <div className="big">{totalOrders}</div>
            <div className="muted">Total Orders</div>
          </div>
          <div>
            <div className="big">{pendingOrders}</div>
            <div className="muted">Pending</div>
          </div>
          <div>
            <div className="big">{inProgressOrders}</div>
            <div className="muted">In Progress</div>
          </div>
          <div>
            <div className="big">{completedOrders}</div>
            <div className="muted">Completed</div>
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: "8px" }}>
        <button className="btn" onClick={fetchOrders}>
          🔄 Refresh Orders
        </button>
      </div>

      {/* Order Details Modal */}
      <Modal 
        open={detailsOpen} 
        title={`Order Details - #${selectedOrder?.order_token}`}
        onClose={() => setDetailsOpen(false)}
        size="large"
      >
        {selectedOrder && (
          <div className="order-details">
            <div className="details-grid">
              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedOrder.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedOrder.customer_email || selectedOrder.guest_email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Date:</span>
                  <span className="detail-value">
                    {new Date(selectedOrder.placed_at).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`status-badge status-${selectedOrder.uiStatus.toLowerCase()}`}>
                      {selectedOrder.uiStatus}
                    </span>
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Order Summary</h4>
                <div className="detail-row">
                  <span className="detail-label">Subtotal:</span>
                  <span className="detail-value">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_total > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Discount:</span>
                    <span className="detail-value">-${selectedOrder.discount_total.toFixed(2)}</span>
                  </div>
                )}
                <div className="detail-row total-row">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value">${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Order Items ({selectedOrder.items_count})</h4>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div className="items-table">
                  <div className="table-header">
                    <span>Item</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id || index} className="table-row">
                      <span className="item-name">{item.item_name}</span>
                      <span className="item-qty">x{item.qty}</span>
                      <span className="item-price">${parseFloat(item.price_each).toFixed(2)}</span>
                      <span className="item-total">${parseFloat(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No items in this order</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        open={!!draft} 
        title="New Order" 
        onClose={() => setDraft(null)}
      >
        {draft && (
          <div>
            <p>Order creation is handled through the main ordering system.</p>
            <p>Use the customer-facing order system to create new orders with proper menu items and pricing.</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setDraft(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}