import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [director, setDirector] = useState(() => {
    const saved = localStorage.getItem('director');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/profile')
        .then(res => {
          if (res.data?.director) {
            setDirector(res.data.director);
            localStorage.setItem('director', JSON.stringify(res.data.director));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('director', JSON.stringify(res.data.director));
      setToken(res.data.token);
      setDirector(res.data.director);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('director');
    setToken('');
    setDirector(null);
  };

  const updateProfile = (updated) => {
    setDirector(prev => ({ ...prev, ...updated }));
    localStorage.setItem('director', JSON.stringify({ ...director, ...updated }));
  };

  return (
    <AuthContext.Provider value={{ director, token, isAuthenticated: !!token, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
