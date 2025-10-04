import React, { useMemo, useState, useEffect } from "react";
import "./orders.css";
import AdminTabs from "../../components/admin/AdminTabs.jsx";
import Modal from "../../components/Modal.jsx";
import { api } from "../../lib/api.js";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
};

// Calculate loyalty tier based on points
const calculateTier = (points) => {
  if (points >= 2000) return "Platinum";
  if (points >= 1000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
};

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Use absolute URL that works
      let url = 'https://cafe-app.duckdns.org/api/auth/admin/users/';
      if (searchQuery) {
        url = `https://cafe-app.duckdns.org/api/auth/admin/users/search/?q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched users data:', data);
      
      // Handle paginated response - extract the results array
      const usersData = data.results || data;
      setUsers(Array.isArray(usersData) ? usersData : []);
      
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  // Calculate totals from real data
  const totals = useMemo(() => {
    // Calculate actual spent amount (you might need to add this field to your user model)
    const totalSpent = users.reduce((sum, user) => {
      // If you have a spent field, use it. Otherwise estimate from points
      return sum + (user.total_spent || (user.points_balance || 0) * 0.1);
    }, 0);

    return {
      users: users.length,
      active: users.filter(u => u.is_active).length,
      points: users.reduce((s, u) => s + (u.points_balance || 0), 0),
      revenue: totalSpent
    };
  }, [users]);

  function onEdit(user) { 
    console.log('🔍 DEBUG - User data when editing:', user);
    
    setDraft({ 
      ...user,
      // Flatten profile fields for the form
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

  function onAdd(){ 
    setDraft({ 
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      display_name: "",
      phone: "",
      contact_email: "",
      points_balance: 0,
      default_currency: "LKR",
      marketing_opt_in: false,
      is_active: true,
      tier: "Bronze"
    }); 
    setAdding(true); 
    setOpen(true); 
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (adding) {
        // Create new user (existing code)
        const userData = {
          username: draft.username,
          email: draft.email,
          password: draft.password,
          first_name: draft.first_name || '',
          last_name: draft.last_name || '',
          display_name: draft.display_name,
          phone: draft.phone,
          contact_email: draft.contact_email,
          marketing_opt_in: draft.marketing_opt_in,
          default_currency: draft.default_currency,
        };
        
        await api.register(userData);
        
      } else {
        // Update user data (auth_user table)
        const userData = {
          first_name: draft.first_name || '',
          last_name: draft.last_name || '',
          email: draft.email,
          is_active: draft.is_active,
        };

        console.log('📤 Updating user data:', userData);
        await api.updateAdminUser(draft.id, userData);

        // Try to update profile data separately
        const profileData = {
          display_name: draft.display_name,
          phone: draft.phone,
          contact_email: draft.contact_email,
          points_balance: draft.points_balance,
          default_currency: draft.default_currency,
          marketing_opt_in: draft.marketing_opt_in,
        };

        console.log('📤 Attempting to update profile data:', profileData);
        
        // Try different profile update approaches
        try {
          // Try profile-specific endpoint
          await api.request(`/api/auth/admin/users/${draft.id}/profile/`, {
            method: 'PATCH',
            body: profileData
          });
          console.log('✅ Profile updated via dedicated endpoint');
        } catch (profileError) {
          console.log('❌ Profile endpoint failed, trying main endpoint:', profileError.message);
          
          // Fallback: try main endpoint with profile data
          await api.updateAdminUser(draft.id, profileData);
          console.log('✅ Profile data sent via main endpoint');
        }
      }
      
      setOpen(false);
      fetchUsers();
      alert(`User ${adding ? 'created' : 'updated'} successfully!`);
      
    } catch (err) {
      console.error("Failed to save user:", err);
      alert(`Failed to save user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserActive(userId, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const newStatus = !currentStatus;
      await api.updateAdminUser(userId, { is_active: newStatus });
      fetchUsers();
      alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert(`Failed to update user status: ${err.message}`);
    }
  }

  async function updateUserStatus(userId, isActive) {
    try {
      // You'll need to implement this endpoint
      console.log(`Update user ${userId} active status to:`, isActive);
      alert('User status update functionality not yet implemented');
      // For now, just refetch
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert(`Failed to update user status: ${err.message}`);
    }
  }

  // Debug function to check API endpoint
  const testEndpoint = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Testing endpoint with token:', token);
      
      const response = await fetch(`${api.API_BASE}/api/auth/admin/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Test response status:', response.status);
      const text = await response.text();
      console.log('Test response text (first 500 chars):', text.substring(0, 500));
      
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  if (loading) return (
    <section className="admin">
      <AdminTabs />
      <h1>User & Loyalty Management</h1>
      <p className="muted">Loading users...</p>
    </section>
  );

  return (
    <section className="admin">
      <AdminTabs />
      <h1>User & Loyalty Management</h1>
      <p className="muted">Manage customer accounts, loyalty points, and user privileges.</p>

      {error && (
        <div className="error-message" style={{
          background: "#f8d7da",
          color: "#721c24",
          padding: "0.75rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          border: "1px solid #f5c6cb"
        }}>
          ❌ {error}
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-primary" onClick={fetchUsers}>
              🔄 Retry
            </button>
            <button className="btn" onClick={testEndpoint} style={{ marginLeft: "0.5rem" }}>
              🐛 Debug API
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid kpis">
        <div className="card kpi"><span>Total Users</span><strong>{totals.users}</strong></div>
        <div className="card kpi"><span>Active Users</span><strong>{totals.active}</strong></div>
        <div className="card kpi"><span>Total Points</span><strong>{totals.points.toLocaleString()}</strong></div>
        <div className="card kpi"><span>Total Revenue</span><strong>${totals.revenue.toFixed(2)}</strong></div>
      </div>

      {/* Search and Actions */}
      <div className="row" style={{marginBottom:"10px", gap: "0.5rem", alignItems: "center"}}>
        <button className="btn btn-primary" onClick={onAdd}>＋ Add User</button>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            padding: "0.5rem", 
            border: "1px solid var(--border)", 
            borderRadius: "4px",
            flex: 1,
            maxWidth: "300px"
          }}
        />
        <button className="btn" onClick={fetchUsers}>🔄 Refresh</button>
        <button className="btn" onClick={testEndpoint}>🐛 Debug</button>
      </div>

      {/* Users Table */}
      <div className="card tbl">
        <h3>Users ({users.length})</h3>
        {users.length === 0 && !loading ? (
          <p className="muted" style={{textAlign: "center", padding: "2rem"}}>
            No users found. <button className="btn-link" onClick={onAdd}>Add your first user</button>
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Loyalty</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const tier = calculateTier(user.points_balance || 0);
                const status = user.is_active ? "Active" : "Inactive";
                
                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.display_name || user.username}</strong>
                      <div className="muted small">
                        Joined {formatDate(user.date_joined)}
                        {user.is_staff && " • Staff"}
                      </div>
                    </td>
                    <td>
                      {user.contact_email || user.email}
                      <br/>
                      {user.phone || "No phone"}
                    </td>
                    <td>
                      {user.points_balance || 0} pts
                      <br/>
                      {/* You might want to calculate spent from orders */}
                      ${((user.points_balance || 0) * 0.1).toFixed(2)} • {user.paid_order_count || 0} orders
                    </td>
                    <td><span className="pill">{tier}</span></td>
                    <td>
                      <span className={`badge ${status === "Active" ? "ok" : "warn"}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div style={{display: "flex", gap: "0.25rem"}}>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => onEdit(user)}
                          title="Edit user"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => toggleUserActive(user.id, user.is_active)}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? "⏸️" : "▶️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={open} title={adding ? "Add User" : "Edit User"} onClose={() => setOpen(false)}>
        {draft && (
          <>
            {/* TEMPORARY DEBUG - Remove this after testing */}
            <div style={{
              background: '#f0f8ff', 
              padding: '10px', 
              marginBottom: '15px', 
              border: '2px solid blue',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>DEBUG - Current Draft Values:</strong><br/>
              First Name: "{draft.first_name}"<br/>
              Last Name: "{draft.last_name}"<br/>
              Display Name: "{draft.display_name}"<br/>
              Contact Email: "{draft.contact_email}"<br/>
              Phone: "{draft.phone}"<br/>
              Points: {draft.points_balance}<br/>
              Currency: {draft.default_currency}
            </div>
            
            <form onSubmit={onSave}>
              {adding && (
                <>
                  <label>
                    Username *
                    <input 
                      required 
                      value={draft.username} 
                      onChange={e => setDraft(d => ({...d, username: e.target.value}))}
                      placeholder="Enter username"
                    />
                  </label>
                  <label>
                    Email *
                    <input 
                      type="email"
                      required 
                      value={draft.email} 
                      onChange={e => setDraft(d => ({...d, email: e.target.value}))}
                      placeholder="user@example.com"
                    />
                  </label>
                  <label>
                    Password *
                    <input 
                      type="password"
                      required 
                      value={draft.password} 
                      onChange={e => setDraft(d => ({...d, password: e.target.value}))}
                      placeholder="Enter password"
                    />
                  </label>
                </>
              )}
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <label>
                  First Name
                  <input 
                    value={draft.first_name || ''} 
                    onChange={e => setDraft(d => ({...d, first_name: e.target.value}))}
                    placeholder="First name"
                  />
                </label>
                <label>
                  Last Name
                  <input 
                    value={draft.last_name || ''} 
                    onChange={e => setDraft(d => ({...d, last_name: e.target.value}))}
                    placeholder="Last name"
                  />
                </label>
              </div>
              
              <label>
                Display Name
                <input 
                  value={draft.display_name} 
                  onChange={e => setDraft(d => ({...d, display_name: e.target.value}))}
                  placeholder="Display name"
                />
              </label>
              
              <label>
                Phone
                <input 
                  value={draft.phone} 
                  onChange={e => setDraft(d => ({...d, phone: e.target.value}))}
                  placeholder="Phone number"
                />
              </label>
              
              <label>
                Contact Email
                <input 
                  type="email"
                  value={draft.contact_email} 
                  onChange={e => setDraft(d => ({...d, contact_email: e.target.value}))}
                  placeholder="Contact email"
                />
              </label>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <label>
                  Points Balance
                  <input 
                    type="number"
                    min="0"
                    value={draft.points_balance} 
                    onChange={e => setDraft(d => ({...d, points_balance: parseInt(e.target.value) || 0}))}
                  />
                </label>
                
                <label>
                  Currency
                  <select 
                    value={draft.default_currency} 
                    onChange={e => setDraft(d => ({...d, default_currency: e.target.value}))}
                  >
                    <option value="LKR">LKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>
              
              {!adding && (
                <label style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
                  <input 
                    type="checkbox" 
                    checked={draft.is_active}
                    onChange={e => setDraft(d => ({...d, is_active: e.target.checked}))}
                  />
                  Active User
                </label>
              )}
              
              <label style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
                <input 
                  type="checkbox" 
                  checked={draft.marketing_opt_in}
                  onChange={e => setDraft(d => ({...d, marketing_opt_in: e.target.checked}))}
                />
                Marketing Opt-in
              </label>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : (adding ? "Add User" : "Save Changes")}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </section>
  );
}