const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ganpati_mandal_token');

  const headers = {
    ...(options.headers || {})
  };

  // If body is NOT FormData, set JSON content-type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle unauthorized / expired token
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('ganpati_mandal_token');
      localStorage.removeItem('ganpati_mandal_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'काहीतरी त्रुटी झाली / An error occurred');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
  },

  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  put: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};

export default api;
