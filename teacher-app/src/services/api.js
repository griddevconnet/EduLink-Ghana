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
    console.log(`🌐 Making API request to: ${config.baseURL}${config.url}`);
    console.log('📋 Request method:', config.method?.toUpperCase());
    console.log('📦 Request params:', config.params);
    
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔑 Auth token exists:', !!token);
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
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('📊 Response status:', response.status);
    return response;
  },
  async (error) => {
    console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log('🚨 Error type:', error.code || error.message);
    console.log('📡 Network error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    if (error.response?.status === 401) {
      // Token expired, logout user
      console.log('🔐 Token expired, logging out user');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Health check function
export const healthCheck = async () => {
  try {
    console.log('🏥 Testing backend connectivity...');
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    console.log('✅ Backend is reachable:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return { success: false, error: error.message };
  }
};

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
  
  bulkMark: (attendanceData) =>
    api.post('/api/attendance/bulk', attendanceData),
  
  getAttendance: (params) =>
    api.get('/api/attendance', { params }),
  
  getByStudent: (studentId, params) =>
    api.get(`/api/attendance/student/${studentId}`, { params }),
  
  getByDateRange: (startDate, endDate, params = {}) =>
    api.get('/api/attendance', { 
      params: { 
        ...params,
        startDate, 
        endDate,
        populate: 'student',
      } 
    }),
  
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
