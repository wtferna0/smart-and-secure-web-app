// AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://cafe-app.duckdns.org/api/auth';

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔐 Fetching user data with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE}/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('👤 User API response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data fetched:', userData);
        setUser(userData);
      } else {
        console.log('❌ User data fetch failed, logging out');
        logout();
      }
    } catch (error) {
      console.error('🚨 Failed to fetch user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // AuthContext.jsx - Update the login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Fetch and return user data immediately
      const userResponse = await fetch(`${API_BASE}/me/`, {
        headers: {
          'Authorization': `Bearer ${data.access}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const isStaffUser = userData.is_staff || userData.is_superuser;
        
        setUser({
          ...userData,
          isStaff: isStaffUser
        });
        
        console.log('✅ Login successful, user is staff:', isStaffUser);
        return { ...data, user: userData, isStaff: isStaffUser };
      } else {
        throw new Error('Failed to fetch user data after login');
      }
    } catch (error) {
      throw new Error('Login failed: ' + error.message);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Registration attempt:', userData);

      const response = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: userData.password,
          first_name: userData.name.split(' ')[0] || '',
          last_name: userData.name.split(' ').slice(1).join(' ') || '',
        }),
      });

      const responseText = await response.text();
      console.log('📡 Response status:', response.status);
      console.log('📡 Response body:', responseText);

      // If user was created but response formatting failed
      if (response.status === 500) {
        console.warn('⚠️ User might have been created despite 500 error');
        
        // Try to login with the same credentials
        console.log('🔄 Attempting auto-login after registration...');
        try {
          const loginResponse = await fetch(`${API_BASE}/token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: userData.email,
              password: userData.password,
            }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Auto-login successful');
            
            localStorage.setItem('access_token', loginData.access);
            localStorage.setItem('refresh_token', loginData.refresh);
            await fetchUserData();
            
            return { success: true, fromFallback: true };
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
        }
      }

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Registration successful:', data);

      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        await fetchUserData();
      }
      
      return data;
    } catch (error) {
      console.error('🚨 Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Call logout endpoint to blacklist token
    if (refreshToken) {
      fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }).catch(console.error);
    }
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // Add this computed property
  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated, // Add this missing property
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}