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
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { detail: await response.text() };

    if (!response.ok) {
      const detail = data?.detail;
      let message = 'An error occurred';

      if (typeof detail === 'string' && detail.trim()) {
        message = detail;
      } else if (Array.isArray(detail) && detail.length) {
        message = detail
          .map((item) => item?.msg || item?.message || JSON.stringify(item))
          .filter(Boolean)
          .join('; ');
      } else if (detail && typeof detail === 'object') {
        message = detail.msg || detail.message || JSON.stringify(detail);
      }

      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.warn('API Error:', error?.message || error);
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

// Valuation API (replaces old prediction)
export const valuationAPI = {
  estimate: async (data) => {
    return apiRequest('/api/valuation/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Messages API
export const messagesAPI = {
  getInbox: async (userId) => {
    return apiRequest(`/api/messages/inbox/${userId}`, { method: 'GET' });
  },
  getSent: async (userId) => {
    return apiRequest(`/api/messages/sent/${userId}`, { method: 'GET' });
  },
  sendMessage: async (senderId, data) => {
    return apiRequest(`/api/messages/send?sender_id=${senderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getConversation: async (userA, userB) => {
    return apiRequest(`/api/messages/conversation/${userA}/${userB}`, { method: 'GET' });
  },
  getUnreadCount: async (userId) => {
    return apiRequest(`/api/messages/unread-count/${userId}`, { method: 'GET' });
  },
};

// Admin API
export const adminAPI = {
  getStats: async (adminId) => {
    return apiRequest(`/api/admin/stats?admin_id=${adminId}`, { method: 'GET' });
  },
  listUsers: async (adminId) => {
    return apiRequest(`/api/admin/users?admin_id=${adminId}`, { method: 'GET' });
  },
  updateUserRole: async (adminId, userId, role) => {
    return apiRequest(`/api/admin/users/${userId}/role?role=${role}&admin_id=${adminId}`, { method: 'PUT' });
  },
  listProperties: async (adminId) => {
    return apiRequest(`/api/admin/properties?admin_id=${adminId}`, { method: 'GET' });
  },
  updatePropertyStatus: async (adminId, propertyId, status) => {
    return apiRequest(`/api/admin/properties/${propertyId}/status?status=${status}&admin_id=${adminId}`, { method: 'PUT' });
  },
  deleteProperty: async (adminId, propertyId) => {
    return apiRequest(`/api/admin/properties/${propertyId}?admin_id=${adminId}`, { method: 'DELETE' });
  },
};

// Brand Protection API
export const brandAPI = {
  detect: async (imageFile) => {
    const form = new FormData();
    form.append('image', imageFile);
    return apiRequest('/api/brand/detect', { method: 'POST', body: form });
  },

  validate: async (imageFile, companyName) => {
    const form = new FormData();
    form.append('image', imageFile);
    form.append('company_name', companyName);
    return apiRequest('/api/brand/validate', { method: 'POST', body: form });
  },

  checkOwner: async (imageFile, userEmail) => {
    const form = new FormData();
    form.append('image', imageFile);
    form.append('user_email', userEmail);
    return apiRequest('/api/brand/check-owner', { method: 'POST', body: form });
  },

  listCompanies: async () => {
    return apiRequest('/api/brand/companies', { method: 'GET' });
  },
};

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };

