import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medifind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('medifind_token');
        localStorage.removeItem('medifind_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerPatient: (data) => api.post('/auth/register/patient', data),
  registerPharmacy: (data) => api.post('/auth/register/pharmacy', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Medicine Discovery Services
export const medicineService = {
  search: (params) => api.get('/medicines/search', { params }),
  getSuggestions: (q) => api.get('/medicines/suggestions', { params: { q } }),
  getById: (id, params) => api.get(`/medicines/${id}`, { params }),
  getCategories: () => api.get('/medicines/categories'),
  getRecentSearches: () => api.get('/medicines/recent-searches')
};

// Pharmacy Services
export const pharmacyService = {
  getNearby: (params) => api.get('/pharmacies/nearby', { params }),
  getById: (id) => api.get(`/pharmacies/${id}`),
  // Pharmacy Owner protected endpoints
  getStats: () => api.get('/pharmacies/owner/stats'),
  getInventory: (params) => api.get('/pharmacies/owner/inventory', { params }),
  addInventoryItem: (data) => api.post('/pharmacies/owner/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/pharmacies/owner/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/pharmacies/owner/inventory/${id}`),
  updateProfile: (data) => api.put('/pharmacies/owner/profile', data)
};

// Reservation Services
export const reservationService = {
  create: (data) => api.post('/reservations', data),
  getPatientReservations: (params) => api.get('/reservations/my', { params }),
  cancelReservation: (id, reason) => api.post(`/reservations/${id}/cancel`, { reason }),
  getPharmacyReservations: (params) => api.get('/reservations/pharmacy', { params }),
  updateStatus: (id, data) => api.put(`/reservations/${id}/status`, data),
  trackByCode: (code) => api.get(`/reservations/track/${code}`)
};

// Admin Services
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getPharmacies: (params) => api.get('/admin/pharmacies', { params }),
  approvePharmacy: (id) => api.put(`/admin/pharmacies/${id}/approve`),
  rejectPharmacy: (id) => api.put(`/admin/pharmacies/${id}/reject`),
  suspendPharmacy: (id) => api.put(`/admin/pharmacies/${id}/suspend`),
  getPatients: (params) => api.get('/admin/patients', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  getMedicines: (params) => api.get('/admin/medicines', { params }),
  createMedicine: (data) => api.post('/admin/medicines', data),
  updateMedicine: (id, data) => api.put(`/admin/medicines/${id}`, data),
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`),
  createCategory: (data) => api.post('/admin/categories', data),
  getReservations: (params) => api.get('/admin/reservations', { params }),
  getAnalytics: () => api.get('/analytics/platform')
};

export default api;
