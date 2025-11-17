import axios from 'axios';

// API Configuration
// Support both port 3000 and 3001, with environment variable override
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : 'http://localhost:3001/api');
const API_BASE_URL = DEFAULT_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// Session management
let sessionId = null;

// Get or create session ID
const getSessionId = () => {
  if (!sessionId) {
    // Try to get from localStorage
    sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      // Generate a simple session ID (backend will handle UUID generation)
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
  }
  return sessionId;
};

// Set session ID in headers for all requests
apiClient.interceptors.request.use((config) => {
  const sid = getSessionId();
  config.headers['X-Session-ID'] = sid;
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle auth errors if needed
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);

// API Methods

// Products
export const productsApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  
  getByCategory: async (categorySlug, params = {}) => {
    const response = await apiClient.get(`/products/category/${categorySlug}`, { params });
    return response.data;
  },
  
  getCategories: async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  },
};

// Cart
export const cartApi = {
  get: async () => {
    const response = await apiClient.get('/cart');
    return response.data;
  },
  
  add: async (productId, quantity = 1) => {
    const response = await apiClient.post('/cart/add', { productId, quantity });
    return response.data;
  },
  
  update: async (productId, quantity) => {
    const response = await apiClient.put('/cart/update', { productId, quantity });
    return response.data;
  },
  
  remove: async (productId) => {
    const response = await apiClient.delete(`/cart/remove/${productId}`);
    return response.data;
  },
  
  clear: async () => {
    const response = await apiClient.delete('/cart/clear');
    return response.data;
  },
};

// Orders
export const ordersApi = {
  checkout: async (shippingAddress, paymentMethod = 'simulated') => {
    const response = await apiClient.post('/orders/checkout', {
      shippingAddress,
      paymentMethod,
    });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  
  getMyOrders: async (params = {}) => {
    const response = await apiClient.get('/orders/my-orders', { params });
    return response.data;
  },
  
  cancel: async (id) => {
    const response = await apiClient.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;

