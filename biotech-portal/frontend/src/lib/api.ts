import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('biotech_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('biotech_token');
        localStorage.removeItem('biotech_user');
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/lecturer')) {
          const loginPath = path.startsWith('/admin') ? '/admin/login' : '/lecturer/login';
          window.location.href = loginPath;
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// Namespaced API helpers
export const api = {
  auth: {
    adminLogin: (email: string, password: string) =>
      apiClient.post('/auth/admin/login', { email, password }),
    lecturerLogin: (email: string, password: string) =>
      apiClient.post('/auth/lecturer/login', { email, password }),
    lecturerRegister: (data: object) =>
      apiClient.post('/auth/lecturer/register', data),
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      apiClient.post('/auth/reset-password', { token, password }),
    getProfile: () => apiClient.get('/auth/profile'),
  },

  public: {
    getStats: () => apiClient.get('/public/stats'),
    getSettings: () => apiClient.get('/public/settings'),
    getAcademic: () => apiClient.get('/public/academic'),
    getLatestMaterials: () => apiClient.get('/public/latest-materials'),
    getAnnouncements: () => apiClient.get('/public/announcements'),
  },

  materials: {
    getPublic: (params?: object) =>
      apiClient.get('/materials/public', { params }),
    trackDownload: (id: number) =>
      apiClient.post(`/materials/download/${id}`),
    upload: (formData: FormData) =>
      apiClient.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    getMy: () => apiClient.get('/materials/my'),
    update: (id: number, formData: FormData) =>
      apiClient.put(`/materials/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    delete: (id: number) => apiClient.delete(`/materials/${id}`),
    adminDelete: (id: number) => apiClient.delete(`/materials/admin/${id}`),
  },

  payment: {
    initiate: (data: object) => apiClient.post('/payment/initiate', data),
    verify: (reference: string) =>
      apiClient.get('/payment/verify', { params: { reference } }),
    findReceipt: (search_type: string, search_value: string) =>
      apiClient.post('/payment/receipt/find', { search_type, search_value }),
    downloadReceiptUrl: (receiptNumber: string) =>
      `${API_URL}/payment/receipt/download/${receiptNumber}`,
  },

  admin: {
    getDashboardStats: () => apiClient.get('/admin/dashboard'),
    getLecturers: (params?: object) => apiClient.get('/admin/lecturers', { params }),
    updateLecturerStatus: (id: number, status: string) =>
      apiClient.patch(`/admin/lecturers/${id}/status`, { status }),
    resetLecturerPassword: (id: number) =>
      apiClient.patch(`/admin/lecturers/${id}/reset-password`),
    deleteLecturer: (id: number) => apiClient.delete(`/admin/lecturers/${id}`),
    getPayments: (params?: object) => apiClient.get('/admin/payments', { params }),
    getSettings: () => apiClient.get('/admin/settings'),
    updateSetting: (key: string, value: string) =>
      apiClient.patch('/admin/settings', { key, value }),
    updateBulkSettings: (settings: object) =>
      apiClient.put('/admin/settings', { settings }),
    uploadBranding: (type: string, file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiClient.post(`/admin/settings/branding/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getAcademicData: () => apiClient.get('/admin/academic'),
    createAcademicSession: (data: object) =>
      apiClient.post('/admin/academic/sessions', data),
    createCourse: (data: object) => apiClient.post('/admin/academic/courses', data),
    getAnnouncements: () => apiClient.get('/admin/announcements'),
    createAnnouncement: (data: object) =>
      apiClient.post('/admin/announcements', data),
    deleteAnnouncement: (id: number) =>
      apiClient.delete(`/admin/announcements/${id}`),
  },
};

export default apiClient;
