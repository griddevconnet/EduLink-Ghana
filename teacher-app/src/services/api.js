import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URLs
const BACKEND_URL = 'https://edulink-backend-07ac.onrender.com';
const AI_URL = 'https://edulink-ai-service.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000, // Increased to 60 seconds for backend startup
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (phone, password) =>
    api.post('/api/auth/login', { phone, password }),
  
  register: (userData) =>
    api.post('/api/auth/register', userData),
  
  getProfile: () =>
    api.get('/api/auth/me'),
  
  updateProfile: (profileData) =>
    api.put('/api/auth/me', profileData),
};

// School APIs
export const schoolAPI = {
  getAll: (params) =>
    api.get('/api/schools', { params }),
  
  getById: (id) =>
    api.get(`/api/schools/${id}`),
  
  getStats: (id) =>
    api.get(`/api/schools/${id}/stats`),
};

// Student APIs
export const studentAPI = {
  getStudents: (params) =>
    api.get('/api/students', { params }),
  
  getAll: (params) =>
    api.get('/api/students', { params }),
  
  getById: (id) =>
    api.get(`/api/students/${id}`),
  
  create: (studentData) =>
    api.post('/api/students', studentData),
  
  update: (id, studentData) =>
    api.put(`/api/students/${id}`, studentData),
  
  delete: (id) =>
    api.delete(`/api/students/${id}`),
  
  getOutOfSchool: (params) =>
    api.get('/api/students/out-of-school', { params }),
  
  getAtRiskStudents: (params) =>
    api.get('/api/students/at-risk', { params }),
};

// Attendance APIs
export const attendanceAPI = {
  mark: (attendanceData) =>
    api.post('/api/attendance', attendanceData),
  
  bulkMark: (attendanceArray) =>
    api.post('/api/attendance/bulk', { attendance: attendanceArray }),
  
  getAttendance: (params) =>
    api.get('/api/attendance', { params }),
  
  getByStudent: (studentId, params) =>
    api.get(`/api/attendance/student/${studentId}`, { params }),
  
  getFollowUpRequired: (params) =>
    api.get('/api/attendance/follow-up', { params }),
};

// Assessment APIs
export const assessmentAPI = {
  create: (assessmentData) =>
    api.post('/api/assessments', assessmentData),
  
  getByStudent: (studentId) =>
    api.get(`/api/assessments/student/${studentId}`),
  
  getSchoolSummary: (schoolId) =>
    api.get(`/api/assessments/school/${schoolId}`),
  
  getInterventionNeeded: (params) =>
    api.get('/api/assessments/intervention-needed', { params }),
};

// AI APIs
const aiAPI = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mlAPI = {
  detectLanguage: (text, phone, region) =>
    aiAPI.post('/ai/detect-language', { text, phone, region }),
  
  scoreRisk: (features) =>
    aiAPI.post('/ai/score-risk', { features }),
  
  getRecommendations: (studentData, riskAssessment, budget) =>
    aiAPI.post('/ai/recommendations', { studentData, riskAssessment, budget }),
};

export default api;
