import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Standard request setup
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Format network / backend offline error
    if (!error.response) {
      return Promise.reject({
        success: false,
        isNetworkError: true,
        message: 'Unable to connect to FraudShield server. Please ensure the backend is running.'
      });
    }

    // Return backend error payload if available
    return Promise.reject(error.response.data || {
      success: false,
      message: error.message || 'An unexpected error occurred'
    });
  }
);

export default axiosClient;
