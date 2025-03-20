import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add ref to track last profile fetch time
  const lastProfileFetch = useRef(0);
  // Add ref to track if auth is initialized
  const isInitialized = useRef(false);
  
  // Fix API URL format - make sure it doesn't have a trailing slash
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Configure axios defaults
  useEffect(() => {
    // Set up axios default headers
    axios.defaults.baseURL = API_URL;
    
    // Set a request interceptor to include the token in all requests
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          // Remove console log in production to reduce noise
          if (import.meta.env.DEV && config.url.includes('profile')) {
            console.log('Adding token to request:', config.url);
          }
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Clean up
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [API_URL]);

  // Initialize auth state from localStorage
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized.current) return;
    
    const loadUserFromStorage = async () => {
      // Check if we've fetched recently to prevent excessive API calls
      const now = Date.now();
      if (now - lastProfileFetch.current < 30000) { // 30 seconds throttle
        setLoading(false);
        return;
      }
      
      lastProfileFetch.current = now;
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          if (import.meta.env.DEV) {
            console.log('Token found in storage:', token.substring(0, 10) + '...');
          }
          
          // Set default headers for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token by getting user profile
          if (import.meta.env.DEV) {
            console.log('Fetching user profile from:', `${API_URL}/api/auth/profile`);
          }
          
          const res = await axios.get(`${API_URL}/api/auth/profile`);
          
          if (import.meta.env.DEV) {
            console.log('Profile response:', res.data);
          }
          
          setUser(res.data);
          
          // Also store user in localStorage for components that need it
          localStorage.setItem('user', JSON.stringify(res.data));
        } else {
          if (import.meta.env.DEV) {
            console.log('No token found in storage');
          }
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
        isInitialized.current = true;
      }
    };
    
    loadUserFromStorage();
  }, [API_URL]);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, userData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    setLoading(true);
    setError('');
    try {
      if (import.meta.env.DEV) {
        console.log('Logging in at:', `${API_URL}/api/auth/login`);
      }
      
      const res = await axios.post(`${API_URL}/api/auth/login`, userData);
      
      if (import.meta.env.DEV) {
        console.log('Login response:', res.data);
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      
      // Dispatch login event for other components to react
      window.dispatchEvent(new Event('userLogin'));
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && user.isActive !== false;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is vendor
  const isVendor = () => {
    return user?.role === 'vendor';
  };

  // Get token for external use
  const getToken = () => {
    return localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isVendor,
        getToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 