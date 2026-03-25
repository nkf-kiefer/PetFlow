import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../api/resources';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('@petflow:access');
        const username = await AsyncStorage.getItem('@petflow:username');
        if (token) setUser({ username, token });
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(username, password) {
    const { data } = await auth.login(username, password);
    await AsyncStorage.setItem('@petflow:access', data.access);
    await AsyncStorage.setItem('@petflow:refresh', data.refresh);
    await AsyncStorage.setItem('@petflow:username', username);
    setUser({ username, token: data.access });
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      '@petflow:access',
      '@petflow:refresh',
      '@petflow:username',
    ]);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
