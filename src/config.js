const API_BASE_URL = 'http://localhost:5000';

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
}; 