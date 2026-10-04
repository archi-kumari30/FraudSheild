import axios from 'axios';
import { getDeviceId } from '../utils/deviceToken';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT and x-device-id
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fraudshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle unauthenticated responses (EC-M10-002) and format data
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Network or server offline
    if (!error.response) {
      return Promise.reject({
        success: false,
        isNetworkError: true,
        message: 'Unable to connect to FraudShield server. Please ensure the backend is running.'
      });
    }

    // Auto-logout on 401 Unauthorized (except on login/register endpoints)
    if (error.response.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthRoute) {
        localStorage.removeItem('fraudshield_token');
        localStorage.removeItem('fraudshield_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }

    return Promise.reject(error.response.data || {
      success: false,
      message: error.message || 'An unexpected error occurred'
    });
  }
);

export default axiosClient;
