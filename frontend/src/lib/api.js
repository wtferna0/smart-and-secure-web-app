export const API_BASE = import.meta.env.VITE_API_BASE || "https://cafe-app.duckdns.org";

async function request(path, { method = "GET", body, headers } = {}) {
  const url = `${API_BASE}${path}`;
  
  // Get authentication token if available
  const token = localStorage.getItem('access_token');
  
  // Default headers with authentication if token exists
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  console.log(`🚀 API ${method} Request:`, url, body);

  try {
    const res = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const text = await res.text();
    let data = {};
    try { 
      data = text ? JSON.parse(text) : {}; 
    } catch (e) {
      console.error("❌ JSON Parse Error:", e, "Response text:", text);
    }

    if (!res.ok) {
      const msg = data?.detail || data?.message || data?.error || `${res.status} ${res.statusText}`;
      console.error(`❌ API Error ${res.status}:`, msg, data);
      throw new Error(msg);
    }
    
    console.log(`✅ API ${method} Success:`, data);
    return data;
  } catch (err) {
    console.error("❌ API Request Failed:", method, url, err);
    throw err;
  }
}

// Public API functions (no authentication required)
export const publicApi = {
  getMenuCategories: () => request("/api/catalog/categories/")
    .then(data => {
      console.log("🔍 Raw categories API response:", data);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    })
    .catch(err => {
      console.error("Categories API error:", err);
      return [];
    }),
  
  getMenuItems: () => request("/api/catalog/items/")
    .then(data => {
      // Handle both direct array and paginated response
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    })
    .catch(err => {
      console.error("Menu items API error:", err);
      return [];
    }),
  
  searchMenuItems: (query) => request(`/api/catalog/items/?search=${encodeURIComponent(query)}`)
    .then(data => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    })
    .catch(err => {
      console.error("Menu search error:", err);
      return [];
    }),
};

export const api = {
  // Chatbot API
  chatbotQuery: (payload) => request("/api/chatbot/query/", { 
    method: "POST", 
    body: payload 
  }),

  // Menu APIs
  getMenuCategories: () => request("/api/catalog/categories/")
    .then(data => {
      console.log("🔍 Admin categories API response:", data);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    })
    .catch(err => {
      console.error("Admin categories API error:", err);
      throw err;
    }),
  
  getMenuItems: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/api/catalog/items/${queryString ? `?${queryString}` : ''}`)
      .then(data => {
        console.log("📦 Menu items data:", data);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      })
      .catch(err => {
        console.error("Failed to fetch menu items:", err);
        throw err;
      });
  },
  
  getMenuItem: (id) => {
    console.log(`🔍 Getting menu item ${id}`);
    return request(`/api/catalog/items/${id}/`);
  },
  
  createMenuItem: (itemData) => {
    console.log("🆕 Creating menu item:", itemData);
    
    // Ensure we have all required fields
    const apiData = {
      name: itemData.name?.trim() || "Untitled",
      price: parseFloat(itemData.price) || 0,
      stock_qty: parseInt(itemData.stock_qty) || 0,
      is_active: itemData.is_active !== false,
      category_id: parseInt(itemData.category_id) || 1, // REQUIRED field
      ...(itemData.image && { image: itemData.image }), // Only include if provided
    };
    
    console.log("📤 Sending to API:", apiData);
    return request("/api/catalog/items/", {
      method: "POST",
      body: apiData
    });
  },

  updateMenuItem: (id, itemData) => {
    console.log(`✏️ Updating menu item ${id}:`, itemData);
    
    const apiData = {
      name: itemData.name?.trim(),
      price: parseFloat(itemData.price),
      stock_qty: parseInt(itemData.stock_qty),
      is_active: itemData.is_active,
      category_id: parseInt(itemData.category_id),
      ...(itemData.image !== undefined && { image: itemData.image }), // Include even if empty string
    };
    
    console.log("📤 Sending UPDATE to API:", apiData);
    return request(`/api/catalog/items/${id}/`, {
      method: "PUT",
      body: apiData
    });
  },

  patchMenuItem: (id, itemData) => {
    console.log(`🔧 Patching menu item ${id}:`, itemData);
    return request(`/api/catalog/items/${id}/`, {
      method: "PATCH", 
      body: itemData
    });
  },

  deleteMenuItem: (id) => {
    console.log(`🗑️ Deleting menu item ${id}`);
    return request(`/api/catalog/items/${id}/`, {
      method: "DELETE"
    });
  },

  updateMenuItemStock: (id, stockQty) => request(`/api/catalog/items/${id}/update_stock/`, {
    method: "POST",
    body: { stock_qty: stockQty }
  }),

  toggleMenuItemActive: (id) => request(`/api/catalog/items/${id}/toggle_active/`, {
    method: "POST"
  }),

  // Category CRUD Operations  
  createCategory: (categoryData) => request("/api/catalog/categories/", {
    method: "POST", 
    body: categoryData
  }),

  updateCategory: (id, categoryData) => request(`/api/catalog/categories/${id}/`, {
    method: "PUT",
    body: categoryData
  }),

  deleteCategory: (id) => request(`/api/catalog/categories/${id}/`, {
    method: "DELETE"
  }),
  
  searchMenuItems: (query) => request(`/api/catalog/items/?search=${encodeURIComponent(query)}`)
    .then(data => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    }),

  // Chatbot-specific menu endpoint
  getChatbotMenu: () => request("/api/menu/"),

  // Crowd/Prediction APIs
  getPredictions: () => request("/api/crowd/current/"), 
  sendFeedback: (payload) => request("/api/crowd/override/", { method: "POST", body: payload }),

  // Order APIs
  createOrder: (orderData) => request("/api/orders/", { 
    method: "POST", 
    body: orderData 
  }),
  
  getOrders: () => request("/api/orders/")
    .then(data => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    }),
  
  getOrder: (id) => request(`/api/orders/${id}/`),
  
  cancelOrder: (id) => request(`/api/orders/${id}/cancel/`, { 
    method: "POST" 
  }),
  
  getOrderStatus: (id) => request(`/api/orders/${id}/status/`),

  // Puzzle APIs
  startPuzzle: (payload) => request("/api/start-puzzle/", { method: "POST", body: payload }),
  completePuzzle: (payload) => request("/api/complete-puzzle/", { method: "POST", body: payload }),
  getSession: (id) => request(`/api/session/${id}/`),

  // Auth APIs
  getCurrentUser: () => request("/api/auth/me/"),
  
  login: (credentials) => request("/api/auth/login/", { 
    method: "POST", 
    body: credentials 
  }),
  
  register: (userData) => request("/api/auth/register/", { 
    method: "POST", 
    body: userData 
  }),
  
  logout: () => request("/api/auth/logout/", { 
    method: "POST" 
  }),

  // Admin Orders APIs
  getAdminOrders: async () => {
    const token = localStorage.getItem('access_token');
    console.log('🔐 Token present:', !!token);
    
    try {
      const response = await fetch(`${API_BASE}/api/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Orders Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Orders API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Orders data received:', data);
      
      return data.results || data;
    } catch (error) {
      console.error('❌ Orders API error:', error);
      throw error;
    }
  },
  
  updateOrderStatus: (orderId, status) => {
    const token = localStorage.getItem('access_token');
    console.log(`🔄 Updating order ${orderId} status to:`, status);
    
    return fetch(`${API_BASE}/api/orders/${orderId}/`, {
      method: "PATCH",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Order status updated:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ Order status update failed:', error);
      throw error;
    });
  },
  
  createAdminOrder: (orderData) => request("/api/orders/", {
    method: "POST",
    body: orderData
  }),
  
  deleteOrder: (orderId) => request(`/api/orders/${orderId}/`, {
    method: "DELETE"
  }),

  // Dashboard stats
  getDashboardStats: () => request("/api/orders/dashboard-stats/").catch(() => ({
    orders_today: 0,
    revenue_today: 0,
    active_orders: 0,
    crowd_level: "Normal"
  })),

  // Add these at the end of your existing api object, before the closing };

  // Admin Users APIs
  getAdminUsers: (search = '') => {
    let url = '/api/auth/admin/users/';
    if (search) {
      url = `/api/auth/admin/users/search/?q=${encodeURIComponent(search)}`;
    }
    return request(url)
      .then(data => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      });
  },

  getAdminUser: (id) => request(`/api/auth/admin/users/${id}/`),

  updateAdminUser: (id, userData) => request(`/api/auth/admin/users/${id}/`, {
    method: 'PATCH',
    body: userData
  }),

  createAdminUser: (userData) => request('/api/auth/register/', {
    method: 'POST',
    body: userData
  }),

  deleteAdminUser: (id) => request(`/api/auth/admin/users/${id}/`, {
    method: 'DELETE'
  }),

  // Admin User Status Management
  toggleUserActive: (id, isActive) => request(`/api/auth/admin/users/${id}/`, {
    method: 'PATCH',
    body: { is_active: isActive }
  }),

  updateUserPoints: (id, points) => request(`/api/auth/admin/users/${id}/`, {
    method: 'PATCH',
    body: { points_balance: points }
  }),

  // Add this to your api.js temporarily
  updateUserProfile: async (userId, profileData) => {
    console.log('🔄 Attempting to update user profile for:', userId);
    
    // Try different endpoint variations
    const endpoints = [
      `/api/auth/admin/users/${userId}/profile/`,
      `/api/auth/users/${userId}/profile/`,
      `/api/users/${userId}/profile/`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log('🔍 Trying endpoint:', endpoint);
        const result = await api.request(endpoint, {
          method: 'PATCH',
          body: profileData
        });
        console.log('✅ Profile updated via:', endpoint);
        return result;
      } catch (error) {
        console.log('❌ Failed with:', endpoint, error.message);
      }
    }
    
    // If all endpoints fail, try updating via the main user endpoint
    console.log('🔄 Falling back to main user endpoint for profile data');
    return api.updateAdminUser(userId, profileData);
  },
};