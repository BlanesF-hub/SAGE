/* ============================================================
   SAGE — Auth Context (JWT + Role-Based Routing)
   ============================================================ */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Rol, LoginResponse, Consultorio } from '../types';

interface AuthUser {
  id: number;
  nombre: string;
  rol: Rol;
  token: string;
  forcePasswordChange: boolean;
  consultorio?: Consultorio;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('sage_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('sage_user', JSON.stringify(user));
      localStorage.setItem('sage_token', user.token);
    } else {
      localStorage.removeItem('sage_user');
      localStorage.removeItem('sage_token');
    }
  }, [user]);

  const login = (data: LoginResponse) => {
    const authUser: AuthUser = {
      id: data.id,
      nombre: data.nombre,
      rol: data.rol,
      token: data.token,
      forcePasswordChange: data.forcePasswordChange,
      consultorio: data.consultorio,
    };
    setUser(authUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
