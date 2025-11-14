// src/config/api.js
export const API_BASE_URL = 'https://hozfisen.my.id';

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `Request failed with status ${response.status}` 
      }));
      throw new Error(error.message || 'Something went wrong');
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json().catch(() => ({}));
    }
    
    return {};
  } catch (error) {
    // Network errors or fetch failures
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};
