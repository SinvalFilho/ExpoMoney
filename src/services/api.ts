import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.18.149:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['@access_token', '@refresh_token']);
        console.error('Sessão expirada. Faça login novamente.');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  const response = await api.post('auth/login/', { username, password });
  return response.data;
};

export const AuthService = {
  async getUser() {
    return api.get('/users/me/');
  },
  async logout() {
    await AsyncStorage.removeItem('@access_token');
  },
};



export const register = async (data: {
  username: string;
  email: string;
  password: string;
  user_type: 'PF' | 'PJ';
}) => {
  const response = await api.post('auth/register/', data);
  return response.data;
};

export const getUser = async () => {
  const response = await api.get('users/me/');
  return response.data;
};

export const TransactionService = {
  async getTransactions() {
    return api.get('/transactions/');
  },
  async getSummary() {
    return api.get('/transactions/summary/');
  },
};

export const createTransaction = async (data: {
  amount: number;
  description: string;
  category: number;
  type: 'IN' | 'OUT';
  payment_method: string;
}) => {
  const response = await api.post('transactions/', data);
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get('transactions/summary/');
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const token = await AsyncStorage.getItem('@access_token');
  const response = await axios.get('http://192.168.18.149:8000/api/categories/', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createCategory = async (name: string) => {
  const response = await api.post<Category>('categories/', { name });
  return response.data;
};

export const updateCategory = async (id: number, name: string) => {
  const response = await api.put<Category>(`categories/${id}/`, { name });
  return response.data;
};

export const deleteCategory = async (id: number) => {
  await api.delete(`categories/${id}/`);
};

const refreshAuthToken = async () => {
  const refreshToken = await AsyncStorage.getItem('@refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await api.post('auth/refresh/', { refresh: refreshToken });
  await AsyncStorage.setItem('@access_token', response.data.access);
  return response.data.access;
};

export interface Category {
  id: number;
  name: string;
}

export default api;

