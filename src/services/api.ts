import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.18.149:8000/api';

export interface Category {
  id: number;
  name: string;
  user: number;
}

 export interface Transaction {
  id: number;
  amount: string;
  description: string;
  category_name: string;
  category_id: number;
  date: string;
  type: 'IN' | 'OUT';
  payment_method: string;
}

interface Summary {
  balance: number;
  total_income: number;
  total_expenses: number;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshAuthToken = async () => {
  const refreshToken = await AsyncStorage.getItem('@refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await api.post('auth/refresh/', { refresh: refreshToken });
  await AsyncStorage.setItem('@access_token', response.data.access);
  return response.data.access;
};

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

export const register = async (data: {
  username: string;
  email: string;
  password: string;
  user_type: 'PF' | 'PJ';
}) => {
  const response = await api.post('auth/register/', data);
  return response.data;
};

export const AuthService = {
  async getUser() {
    const response = await api.get('/users/me/');
    return response.data;
  },
  async logout() {
    await AsyncStorage.removeItem('@access_token');
  },
};

export const TransactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get('/transactions/');
    return response.data;
  },

  async getSummary(): Promise<Summary> {
    const response = await api.get('/transactions/summary/');
    return response.data;
  },

  async createTransaction(data: {
    amount: number;
    description: string;
    category: number;
    type: 'IN' | 'OUT';
    payment_method: string;
    date: string;
  }): Promise<Transaction> {
    const response = await api.post('transactions/', data);
    return response.data;
  },

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}/`, data);
    return response.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/transactions/${id}/`);
  },
};

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories/');
    return response.data;
  },

  async createCategory(name: string): Promise<Category> {
    const response = await api.post('categories/', { name });
    return response.data;
  },

  async updateCategory(id: number, name: string): Promise<Category> {
    const response = await api.put(`categories/${id}/`, { name });
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`categories/${id}/`);
  },
};

export const UserService = {
  async getProfile() {
    const response = await api.get('/users/me/');
    return response.data;
  },
};

export default api;