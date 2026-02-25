// API Base URL - Update this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Helper function to remove auth token from localStorage
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token if provided in response (backend returns access_token)
    if (response.access_token) {
      setAuthToken(response.access_token);
    }
    
    return response;
  },

  // Logout user
  logout: () => {
    removeAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Real Estate API
export const realEstateAPI = {
  // Get all properties with optional filters
  getProperties: async (filters = {}) => {
    const { min_price, max_price } = filters;
    const params = new URLSearchParams();
    
    if (min_price !== undefined && min_price !== null) {
      params.append('min_price', min_price);
    }
    if (max_price !== undefined && max_price !== null) {
      params.append('max_price', max_price);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/real_estate/?${queryString}` : '/api/real_estate/';
    
    return apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get a single property by ID
  getProperty: async (propertyId) => {
    return apiRequest(`/api/real_estate/${propertyId}`, {
      method: 'GET',
    });
  },

  // Add a new property
  addProperty: async (propertyData) => {
    return apiRequest('/api/real_estate/', {
      method: 'POST',
      body: propertyData,
    });
  },

  // Update a property
  updateProperty: async (propertyId, propertyData) => {
    return apiRequest(`/api/real_estate/${propertyId}`, {
      method: 'PUT',
      body: propertyData,
    });
  },

  // Delete a property
  deleteProperty: async (propertyId) => {
    return apiRequest(`/api/real_estate/${propertyId}`, {
      method: 'DELETE',
    });
  },
};

// User API
export const userAPI = {
  // Add real estate for a user
  addUserRealEstate: async (userId, realEstateData) => {
    return apiRequest(`/api/user/user/${userId}/realestate`, {
      method: 'POST',
      body: JSON.stringify(realEstateData),
    });
  },

  // Get all real estates for a user
  getUserRealEstates: async (userId) => {
    return apiRequest(`/api/user/user/${userId}/realestate`, {
      method: 'GET',
    });
  },

  getProfile: async (userId) => {
    return apiRequest(`/api/user/user/${userId}/profile`, {
      method: 'GET',
    });
  },

  updateProfile: async (userId, profileData) => {
    return apiRequest(`/api/user/user/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  getFavorites: async (userId) => {
    return apiRequest(`/api/user/user/${userId}/favorites`, {
      method: 'GET',
    });
  },

  addFavorite: async (userId, propertyId) => {
    return apiRequest(`/api/user/user/${userId}/favorites/${propertyId}`, {
      method: 'POST',
    });
  },

  removeFavorite: async (userId, propertyId) => {
    return apiRequest(`/api/user/user/${userId}/favorites/${propertyId}`, {
      method: 'DELETE',
    });
  },
};

// Recommendations API
export const recommendationsAPI = {
  // Get recommendations for a user
  getRecommendations: async (userId) => {
    return apiRequest(`/api/recommendations/user/${userId}`, {
      method: 'GET',
    });
  },
};

// Prediction API
export const predictionAPI = {
  // Predict property price
  predictPrice: async (data) => {
    return apiRequest('/api/predict/price', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };

