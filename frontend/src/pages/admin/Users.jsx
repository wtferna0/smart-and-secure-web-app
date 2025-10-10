import React, { useMemo, useState, useEffect } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";
import { api } from "../../lib/api.js";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
};

// Calculate loyalty tier based on points
const calculateTier = (points) => {
  if (points >= 2000) return "Platinum";
  if (points >= 1000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Responsive styles
  const styles = {
    admin: { padding: "1rem", maxWidth: "1400px", margin: "0 auto" },
    header: { textAlign: "center", marginBottom: "2rem" },
    kpis: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem"
    },
    kpi: { textAlign: "center", padding: "1rem" },
    searchRow: {
      display: "flex",
      gap: "1rem",
      marginBottom: "1.5rem",
      alignItems: "center",
      flexWrap: "wrap"
    },
    searchBox: { flex: "1", minWidth: "200px" },
    actionButtons: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
    tableHeader: { padding: "1rem", borderBottom: "1px solid var(--border)" },
    tableContainer: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
    th: {
      textAlign: "left",
      padding: "1rem 0.5rem",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap"
    },
    td: { padding: "1rem 0.5rem", borderBottom: "1px solid var(--border)", verticalAlign: "top" },
    userInfo: { display: "flex", flexDirection: "column", gap: "0.25rem" },
    contactInfo: { display: "flex", flexDirection: "column", gap: "0.25rem" },
    loyaltyInfo: { display: "flex", flexDirection: "column", gap: "0.25rem" },
    mobileUserCard: {
      background: "white",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1rem"
    },
    mobileUserHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "0.75rem"
    },
    mobileUserDetails: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      marginBottom: "1rem"
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.25rem 0"
    },
    mobileActions: {
      display: "flex",
      gap: "0.5rem",
      justifyContent: "flex-end"
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem"
    },
    modalActions: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-end",
      marginTop: "2rem",
      paddingTop: "1rem",
      borderTop: "1px solid var(--border)"
    }
  };

  // Mobile responsive overrides
  const mobileStyles = {
    kpis: {
      ...styles.kpis,
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "0.5rem"
    },
    kpi: { ...styles.kpi, padding: "0.75rem 0.5rem" },
    searchRow: {
      ...styles.searchRow,
      flexDirection: "column",
      alignItems: "stretch"
    },
    searchBox: { ...styles.searchBox, minWidth: "auto" },
    formRow: {
      ...styles.formRow,
      gridTemplateColumns: "1fr"
    },
    modalActions: {
      ...styles.modalActions,
      flexDirection: "column"
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentStyles = isMobile ? { ...styles, ...mobileStyles } : styles;

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found.');

      let url = 'https://cafe-app.duckdns.org/api/auth/admin/users/';
      if (searchQuery) {
        url = `https://cafe-app.duckdns.org/api/auth/admin/users/search/?q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const usersData = data.results || data;
      setUsers(Array.isArray(usersData) ? usersData : []);

    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [searchQuery]);

  const totals = useMemo(() => ({
    users: users.length,
    active: users.filter(u => u.is_active).length,
    points: users.reduce((s, u) => s + (u.points_balance || 0), 0),
    revenue: users.reduce((sum, user) => sum + (user.total_spent || (user.points_balance || 0) * 0.1), 0)
  }), [users]);

  function onEdit(user) {
    setDraft({
      ...user,
      display_name: user.display_name || '',
      phone: user.phone || '',
      contact_email: user.contact_email || '',
      points_balance: user.points_balance || 0,
      default_currency: user.default_currency || 'LKR',
      marketing_opt_in: user.marketing_opt_in || false,
      is_active: user.is_active,
      tier: calculateTier(user.points_balance || 0)
    });
    setAdding(false);
    setOpen(true);
  }

  function onAdd() {
    setDraft({
      username: "", email: "", first_name: "", last_name: "", password: "",
      display_name: "", phone: "", contact_email: "", points_balance: 0,
      default_currency: "LKR", marketing_opt_in: false, is_active: true, tier: "Bronze"
    });
    setAdding(true);
    setOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (adding) {
        await api.register({
          username: draft.username, email: draft.email, password: draft.password,
          first_name: draft.first_name || '', last_name: draft.last_name || '',
          display_name: draft.display_name, phone: draft.phone,
          contact_email: draft.contact_email, marketing_opt_in: draft.marketing_opt_in,
          default_currency: draft.default_currency,
        });
      } else {
        await api.updateAdminUser(draft.id, {
          first_name: draft.first_name || '', last_name: draft.last_name || '',
          email: draft.email, is_active: draft.is_active,
        });
        try {
          await api.request(`/api/auth/admin/users/${draft.id}/profile/`, {
            method: 'PATCH',
            body: {
              display_name: draft.display_name, phone: draft.phone,
              contact_email: draft.contact_email, points_balance: draft.points_balance,
              default_currency: draft.default_currency, marketing_opt_in: draft.marketing_opt_in,
            }
          });
        } catch (profileError) {
          await api.updateAdminUser(draft.id, {
            display_name: draft.display_name, phone: draft.phone,
            contact_email: draft.contact_email, points_balance: draft.points_balance,
            default_currency: draft.default_currency, marketing_opt_in: draft.marketing_opt_in,
          });
        }
      }
      setOpen(false);
      fetchUsers();
      alert(`User ${adding ? 'created' : 'updated'} successfully!`);
    } catch (err) {
      alert(`Failed to save user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserActive(userId, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      await api.updateAdminUser(userId, { is_active: !currentStatus });
      fetchUsers();
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      alert(`Failed to update user status: ${err.message}`);
    }
  }

  if (loading) return (
    <section style={currentStyles.admin}>
      <AdminTabs />
      <h1>User & Loyalty Management</h1>
      <p className="muted">Loading users...</p>
    </section>
  );

  const tierColors = {
    Platinum: { background: "#e5e4e2", color: "#333" },
    Gold: { background: "#ffd700", color: "#333" },
    Silver: { background: "#c0c0c0", color: "#333" },
    Bronze: { background: "#cd7f32", color: "white" }
  };

  return (
    <section style={currentStyles.admin}>
      <AdminTabs />

      <div style={currentStyles.header}>
        <h1 style={{ marginBottom: "0.5rem", fontSize: isMobile ? "1.5rem" : "2rem" }}>
          User & Loyalty Management
        </h1>
        <p className="muted">Manage customer accounts, loyalty points, and user privileges.</p>
      </div>

      {error && (
        <div style={{
          background: "#f8d7da", color: "#721c24", padding: "0.75rem",
          borderRadius: "4px", marginBottom: "1rem", border: "1px solid #f5c6cb"
        }}>
          ❌ {error}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={fetchUsers}>🔄 Retry</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={currentStyles.kpis}>
        {[
          { label: "Total Users", value: totals.users },
          { label: "Active Users", value: totals.active },
          { label: "Total Points", value: totals.points.toLocaleString() },
          { label: "Total Revenue", value: `$${totals.revenue.toFixed(2)}` }
        ].map((item, index) => (
          <div key={index} className="card kpi" style={currentStyles.kpi}>
            <span style={{ display: "block", fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
              {item.label}
            </span>
            <strong style={{ fontSize: isMobile ? "1.4rem" : "1.8rem", fontWeight: "bold", color: "#333" }}>
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      {/* Search and Actions */}
      <div style={currentStyles.searchRow}>
        <button className="btn btn-primary" onClick={onAdd}>＋ Add User</button>
        <div style={currentStyles.searchBox}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "8px" }}
          />
        </div>
        <div style={currentStyles.actionButtons}>
          <button className="btn" onClick={fetchUsers}>🔄 Refresh</button>
        </div>
      </div>

      {/* Desktop Table */}
      {!isMobile && (
        <div className="card tbl">
          <div style={currentStyles.tableHeader}>
            <h3>Users ({users.length})</h3>
          </div>
          {users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p className="muted">No users found.</p>
            </div>
          ) : (
            <div style={currentStyles.tableContainer}>
              <table style={currentStyles.table}>
                <thead>
                  <tr>
                    <th style={currentStyles.th}>User</th>
                    <th style={currentStyles.th}>Contact</th>
                    <th style={currentStyles.th}>Loyalty</th>
                    <th style={currentStyles.th}>Tier</th>
                    <th style={currentStyles.th}>Status</th>
                    <th style={currentStyles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const tier = calculateTier(user.points_balance || 0);
                    const status = user.is_active ? "Active" : "Inactive";

                    return (
                      <tr key={user.id}>
                        <td style={currentStyles.td}>
                          <div style={currentStyles.userInfo}>
                            <strong>{user.display_name || user.username}</strong>
                            <div className="muted small">
                              Joined {formatDate(user.date_joined)}
                              {user.is_staff && " • Staff"}
                            </div>
                          </div>
                        </td>
                        <td style={currentStyles.td}>
                          <div style={currentStyles.contactInfo}>
                            <span>{user.contact_email || user.email}</span>
                            <span className="muted small">{user.phone || "No phone"}</span>
                          </div>
                        </td>
                        <td style={currentStyles.td}>
                          <div style={currentStyles.loyaltyInfo}>
                            <span>{user.points_balance || 0} pts</span>
                            <span className="muted small">
                              ${((user.points_balance || 0) * 0.1).toFixed(2)} • {user.paid_order_count || 0} orders
                            </span>
                          </div>
                        </td>
                        <td style={currentStyles.td}>
                          <span style={{
                            padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem",
                            fontWeight: "600", textTransform: "uppercase", ...tierColors[tier]
                          }}>
                            {tier}
                          </span>
                        </td>
                        <td style={currentStyles.td}>
                          <span className={`badge ${status === "Active" ? "ok" : "warn"}`}>
                            {status}
                          </span>
                        </td>
                        <td style={currentStyles.td}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button className="btn btn-ghost" onClick={() => onEdit(user)}>✏️</button>
                            <button className="btn btn-ghost" onClick={() => toggleUserActive(user.id, user.is_active)}>
                              {user.is_active ? "⏸️" : "▶️"}
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
      )}

      {/* Mobile Cards */}
      {isMobile && (
        <div>
          <h3 style={{ marginBottom: "1rem" }}>Users ({users.length})</h3>
          {users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p className="muted">No users found.</p>
            </div>
          ) : (
            users.map((user) => {
              const tier = calculateTier(user.points_balance || 0);
              const status = user.is_active ? "Active" : "Inactive";

              return (
                <div key={user.id} style={currentStyles.mobileUserCard}>
                  <div style={currentStyles.mobileUserHeader}>
                    <div>
                      <strong>{user.display_name || user.username}</strong>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                        <span className={`badge ${status === "Active" ? "ok" : "warn"}`}>{status}</span>
                        {user.is_staff && <span className="badge" style={{ background: "#e3f2fd", color: "#1976d2" }}>Staff</span>}
                      </div>
                    </div>
                    <span style={{
                      padding: "0.3rem 0.6rem", borderRadius: "12px", fontSize: "0.7rem",
                      fontWeight: "600", ...tierColors[tier]
                    }}>
                      {tier}
                    </span>
                  </div>

                  <div style={currentStyles.mobileUserDetails}>
                    <div style={currentStyles.detailRow}>
                      <span className="muted">Email:</span>
                      <span>{user.contact_email || user.email}</span>
                    </div>
                    <div style={currentStyles.detailRow}>
                      <span className="muted">Phone:</span>
                      <span>{user.phone || "No phone"}</span>
                    </div>
                    <div style={currentStyles.detailRow}>
                      <span className="muted">Points:</span>
                      <span>{user.points_balance || 0} pts</span>
                    </div>
                    <div style={currentStyles.detailRow}>
                      <span className="muted">Joined:</span>
                      <span>{formatDate(user.date_joined)}</span>
                    </div>
                  </div>

                  <div style={currentStyles.mobileActions}>
                    <button className="btn btn-ghost" onClick={() => onEdit(user)}>✏️ Edit</button>
                    <button className="btn btn-ghost" onClick={() => toggleUserActive(user.id, user.is_active)}>
                      {user.is_active ? "⏸️ Deactivate" : "▶️ Activate"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={open} title={adding ? "Add User" : "Edit User"} onClose={() => setOpen(false)}>
        {draft && (
          <form onSubmit={onSave}>
            {adding && (
              <>
                <label>Username *<input required value={draft.username} onChange={e => setDraft(d => ({ ...d, username: e.target.value }))} /></label>
                <label>Email *<input type="email" required value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} /></label>
                <label>Password *<input type="password" required value={draft.password} onChange={e => setDraft(d => ({ ...d, password: e.target.value }))} /></label>
              </>
            )}

            <div style={currentStyles.formRow}>
              <label>First Name<input value={draft.first_name || ''} onChange={e => setDraft(d => ({ ...d, first_name: e.target.value }))} /></label>
              <label>Last Name<input value={draft.last_name || ''} onChange={e => setDraft(d => ({ ...d, last_name: e.target.value }))} /></label>
            </div>

            <label>Display Name<input value={draft.display_name} onChange={e => setDraft(d => ({ ...d, display_name: e.target.value }))} /></label>
            <label>Phone<input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} /></label>
            <label>Contact Email<input type="email" value={draft.contact_email} onChange={e => setDraft(d => ({ ...d, contact_email: e.target.value }))} /></label>

            <div style={currentStyles.formRow}>
              <label>Points Balance<input type="number" min="0" value={draft.points_balance} onChange={e => setDraft(d => ({ ...d, points_balance: parseInt(e.target.value) || 0 }))} /></label>
              <label>Currency
                <select value={draft.default_currency} onChange={e => setDraft(d => ({ ...d, default_currency: e.target.value }))}>
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>

            {!adding && (
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" checked={draft.is_active} onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))} />
                Active User
              </label>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" checked={draft.marketing_opt_in} onChange={e => setDraft(d => ({ ...d, marketing_opt_in: e.target.checked }))} />
              Marketing Opt-in
            </label>

            <div style={currentStyles.modalActions}>
              <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : (adding ? "Add User" : "Save Changes")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}