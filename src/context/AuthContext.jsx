import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('gym_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('gym_users') || '[]');
    const exists = users.find(u => u.email === userData.email);
    if (exists) {
      throw new Error('Email already registered');
    }
    const newUser = { ...userData, id: Date.now().toString() };
    users.push(newUser);
    localStorage.setItem('gym_users', JSON.stringify(users));
    localStorage.setItem('gym_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('gym_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password');
    }
    localStorage.setItem('gym_user', JSON.stringify(found));
    setUser(found);
    return found;
  };

  const logout = () => {
    localStorage.removeItem('gym_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
