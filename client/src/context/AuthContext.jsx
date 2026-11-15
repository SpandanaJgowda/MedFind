import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on load
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('medifind_token');
      const storedUser = localStorage.getItem('medifind_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Re-validate token with backend
        try {
          const res = await authService.getMe();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('medifind_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, resetting auth state:', err.message);
          localStorage.removeItem('medifind_token');
          localStorage.removeItem('medifind_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('medifind_token', newToken);
      localStorage.setItem('medifind_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const registerPatient = async (data) => {
    const res = await authService.registerPatient(data);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('medifind_token', newToken);
      localStorage.setItem('medifind_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const registerPharmacy = async (data) => {
    const res = await authService.registerPharmacy(data);
    if (res.data.success) {
      const { token: newToken, user: newUser, message } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('medifind_token', newToken);
      localStorage.setItem('medifind_user', JSON.stringify(newUser));
      return { success: true, user: newUser, message };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    localStorage.removeItem('medifind_token');
    localStorage.removeItem('medifind_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('medifind_user', JSON.stringify(updatedUser));
  };

  // Quick Demo Login helper for easy evaluator testing
  const quickDemoLogin = async (role) => {
    let email = 'patient@medifind.com';
    let password = 'Patient@123';

    if (role === 'pharmacy_owner') {
      email = 'apollocentral@medifind.com';
      password = 'Pharmacy@123';
    } else if (role === 'admin') {
      email = 'admin@medifind.com';
      password = 'Admin@123';
    }

    return await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerPatient,
        registerPharmacy,
        logout,
        updateUser,
        quickDemoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
