import React, { useMemo, useState, useEffect } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";
import { api } from "../../lib/api.js";

export default function AdminMenuStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch menu items and categories
  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsData, categoriesData] = await Promise.all([
        api.getMenuItems(),
        api.getMenuCategories()
      ]);

      console.log("📦 Menu items:", itemsData);
      console.log("📂 Categories:", categoriesData);

      setItems(itemsData || []);
      setCategories(categoriesData || []);

    } catch (err) {
      console.error("Failed to fetch menu data:", err);
      setError(`Failed to load menu data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const totals = useMemo(() => ({
    total: items.length,
    available: items.filter(i => i.is_active && i.stock_qty > 0).length,
    low: items.filter(i => i.stock_qty > 0 && i.stock_qty <= 10).length,
    out: items.filter(i => i.stock_qty === 0).length,
  }), [items]);

  const getStockBadge = (item) => {
    if (item.stock_qty === 0) return { text: "Out", class: "bad" };
    if (item.stock_qty <= 10) return { text: "Low", class: "warning" };
    return null;
  };

  const getStatusText = (item) => {
    if (!item.is_active) return "Unavailable";
    if (item.stock_qty === 0) return "Out of Stock";
    return "Available";
  };

  function onEdit(item) {
    setDraft({
      ...item,
      category_id: item.category?.id || item.category,
      description: item.description || "",
      image: item.image || ""
    });
    setAdding(false);
    setOpen(true);
  }

  function onAdd() {
    setDraft({
      name: "",
      description: "",
      category_id: categories[0]?.id || "",
      price: 0,
      stock_qty: 0,
      is_active: true,
      image: ""
    });
    setAdding(true);
    setOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!draft) return;

    try {
      setSaving(true);

      const itemData = {
        name: draft.name.trim(),
        description: draft.description?.trim() || "",
        category_id: draft.category_id,
        price: parseFloat(draft.price) || 0,
        stock_qty: parseInt(draft.stock_qty) || 0,
        is_active: draft.is_active !== false,
      };

      let savedItem;

      if (adding) {
        // Create new item
        savedItem = await api.createMenuItem(itemData);
        setItems(prev => [savedItem, ...prev]);
        showSuccess("Item created successfully!");
      } else {
        // Update existing item
        savedItem = await api.updateMenuItem(draft.id, itemData);
        setItems(prev => prev.map(item =>
          item.id === draft.id ? savedItem : item
        ));
        showSuccess("Item updated successfully!");
      }

      setOpen(false);

    } catch (err) {
      console.error("Failed to save item:", err);
      alert(`Failed to save item: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item, idx) {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteMenuItem(item.id);
      setItems(prev => prev.filter((_, i) => i !== idx));
      showSuccess("Item deleted successfully!");
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert(`Failed to delete item: ${err.message}`);
    }
  }

  async function onToggleActive(item) {
    try {
      const updatedItem = await api.toggleMenuItemActive(item.id);
      setItems(prev => prev.map(i =>
        i.id === item.id ? updatedItem : i
      ));
      showSuccess(`Item ${updatedItem.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error("Failed to toggle item status:", err);
      alert(`Failed to update item status: ${err.message}`);
    }
  }

  async function onUpdateStock(item, newStock) {
    try {
      const updatedItem = await api.updateMenuItemStock(item.id, newStock);
      setItems(prev => prev.map(i =>
        i.id === item.id ? updatedItem : i
      ));
      showSuccess("Stock quantity updated successfully!");
    } catch (err) {
      console.error("Failed to update stock:", err);
      alert(`Failed to update stock: ${err.message}`);
    }
  }

  if (loading) return (
    <section className="admin">
      <AdminTabs />
      <h1>Menu & Stock Management</h1>
      <p className="muted">Loading menu data...</p>
    </section>
  );

  if (error) return (
    <section className="admin">
      <AdminTabs />
      <h1>Menu & Stock Management</h1>
      <p className="bad">{error}</p>
      <button className="btn btn-primary" onClick={fetchMenuData}>
        🔄 Retry
      </button>
    </section>
  );

  return (
    <section className="admin">
      <AdminTabs />
      <h1>Menu & Stock Management</h1>
      <p className="muted">Manage menu items, prices, categories, and stock levels. Showing {items.length} items.</p>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message" style={{
          background: "#d4edda",
          color: "#155724",
          padding: "0.75rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          border: "1px solid #c3e6cb"
        }}>
          ✅ {successMessage}
        </div>
      )}

      {/* KPI Cards - Mobile Responsive */}
      <div className="grid kpis" style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem"
      }}>
        <div className="card kpi">
          <span>Total Items</span>
          <strong>{totals.total}</strong>
        </div>
        <div className="card kpi">
          <span>Available</span>
          <strong>{totals.available}</strong>
        </div>
        <div className="card kpi">
          <span>Low Stock</span>
          <strong>{totals.low}</strong>
        </div>
        <div className="card kpi">
          <span>Out of Stock</span>
          <strong>{totals.out}</strong>
        </div>
      </div>

      {/* Action Bar - Mobile Responsive */}
      <div className="row" style={{
        marginBottom: "1rem",
        gap: "0.5rem",
        flexWrap: "wrap"
      }}>
        <button className="btn btn-primary" onClick={onAdd}>
          ＋ Add Item
        </button>
        <button className="btn" onClick={fetchMenuData}>
          🔄 Refresh
        </button>
      </div>

      {/* Menu Items Table - Mobile Responsive */}
      <div className="card tbl">
        <h3>Menu Items ({items.length})</h3>
        {items.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>
            No menu items found. <button className="btn-link" onClick={onAdd}>Add your first item</button>
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="hide-on-mobile">Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th className="hide-on-mobile">Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const badge = getStockBadge(item);
                  const status = getStatusText(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="row" style={{ alignItems: "center", gap: ".6rem" }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                objectFit: "cover",
                                backgroundColor: "#f5f5f5"
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: "#e9ecef",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              color: "#6c757d"
                            }}>
                              📷
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <strong style={{
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "150px"
                            }}>
                              {item.name}
                            </strong>
                            {item.description && (
                              <div className="muted small" style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "150px"
                              }}>
                                {item.description}
                              </div>
                            )}
                            <div className="show-on-mobile-only" style={{ marginTop: "0.25rem" }}>
                              <span className="pill small">
                                {item.category?.name || "Uncategorized"}
                              </span>
                              <div className={`status-mobile ${status === "Out of Stock" || !item.is_active ? "bad" : ""}`}>
                                {status}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-on-mobile">
                        <span className="pill">
                          {item.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <strong>${parseFloat(item.price).toFixed(2)}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span>{item.stock_qty}</span>
                          {badge && (
                            <span className={`badge ${badge.class}`}>
                              {badge.text}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`hide-on-mobile ${status === "Out of Stock" || !item.is_active ? "bad" : ""}`}>
                        {status}
                      </td>
                      <td>
                        <div className="actions-container" style={{
                          display: "flex",
                          gap: "0.25rem",
                          flexWrap: "wrap"
                        }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onEdit(item)}
                            title="Edit item"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onToggleActive(item)}
                            title={item.is_active ? "Deactivate" : "Activate"}
                          >
                            {item.is_active ? "⏸️" : "▶️"}
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onDelete(item, i)}
                            title="Delete item"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Mobile Responsive */}
      <Modal open={open} title={adding ? "Add Menu Item" : "Edit Menu Item"} onClose={() => setOpen(false)}>
        {draft && (
          <form onSubmit={onSave}>
            <label>
              Image URL
              <input
                value={draft.image || ""}
                onChange={e => setDraft(d => ({ ...d, image: e.target.value }))}
                placeholder="/images/menu/item.jpg"
              />
            </label>

            <label>
              Name *
              <input
                required
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g., Cappuccino"
              />
            </label>

            <label>
              Description
              <textarea
                rows="3"
                value={draft.description || ""}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="Describe this menu item..."
              />
            </label>

            <label>
              Category *
              <select
                value={draft.category_id}
                onChange={e => setDraft(d => ({ ...d, category_id: e.target.value }))}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-columns" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem"
            }}>
              <label>
                Price (USD) *
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={e => setDraft(d => ({ ...d, price: e.target.value }))}
                  required
                />
              </label>

              <label>
                Stock Quantity *
                <input
                  type="number"
                  min="0"
                  value={draft.stock_qty}
                  onChange={e => setDraft(d => ({ ...d, stock_qty: e.target.value }))}
                  required
                />
              </label>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={draft.is_active !== false}
                onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))}
              />
              Available on menu
            </label>

            <div className="modal-actions" style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              flexWrap: "wrap"
            }}>
              <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : (adding ? "Add Item" : "Save Changes")}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Mobile Responsive CSS */}
      <style jsx>{`
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .table {
          width: 100%;
          min-width: 600px;
        }
        
        .btn-icon {
          padding: 0.5rem;
          min-width: auto;
        }
        
        .status-mobile {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .pill.small {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
        }
        
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none;
          }
          
          .show-on-mobile-only {
            display: block;
          }
          
          .kpi {
            padding: 0.75rem;
            text-align: center;
          }
          
          .kpi span {
            font-size: 0.8rem;
          }
          
          .kpi strong {
            font-size: 1.2rem;
          }
          
          .actions-container {
            justify-content: center;
          }
        }
        
        @media (min-width: 769px) {
          .show-on-mobile-only {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .form-columns {
            grid-template-columns: 1fr;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .modal-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}