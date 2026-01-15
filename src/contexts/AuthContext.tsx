import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: Record<string, User> = {
  'manager@society.com': {
    memberId: 'MGR001',
    name: 'Rajesh Kumar',
    email: 'manager@society.com',
    phone: '+91 98765 43210',
    flatNo: 'A-101',
    wing: 'A',
    role: 'manager',
    maintenanceStatus: 'paid',
    outstandingDues: 0,
  },
  'user@society.com': {
    memberId: 'USR001',
    name: 'Priya Sharma',
    email: 'user@society.com',
    phone: '+91 98765 12345',
    flatNo: 'B-205',
    wing: 'B',
    role: 'user',
    maintenanceStatus: 'pending',
    outstandingDues: 5000,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
  });

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = demoUsers[email.toLowerCase()];
    
    if (user && user.role === role && password === 'demo123') {
      setAuthState({
        isAuthenticated: true,
        user,
        role: user.role,
      });
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
