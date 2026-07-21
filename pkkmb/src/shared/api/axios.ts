import axios from 'axios';

// Get base URL from env, or fallback to relative path if proxy is used
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const baseURL = API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor for appending access token
apiClient.interceptors.request.use(
  (config) => {
    // Note: We're not accessing localStorage directly here to support SSR/RSC better,
    // but on the client side, Zustand's persist or a custom getter can provide the token.
    // Ideally, the token is managed by Zustand or cookie.
    
    // For now, if we are in browser, we can safely grab it from localStorage if needed,
    // but the preferred approach is using Zustand's get() which we'll inject or use directly.
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling 401 errors (token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Assume backend has a /auth/refresh endpoint relying on HTTP-only refresh token cookie
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        if (refreshResponse.data?.accessToken) {
          const newToken = refreshResponse.data.accessToken;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', newToken);
          }
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token expired)
        // Redirect to login or dispatch a logout action
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
