import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://Nataliakiefer.pythonanywhere.com/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT access token to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@petflow:access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silently refresh token on 401, then retry original request once
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('@petflow:refresh');
        const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
        await AsyncStorage.setItem('@petflow:access', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch {
        await AsyncStorage.multiRemove(['@petflow:access', '@petflow:refresh']);
      }
    }
    return Promise.reject(error);
  },
);

export default client;
