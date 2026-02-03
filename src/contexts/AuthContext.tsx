import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'manager' | 'user';

export interface UserProfile {
  id: string;
  userId: string;
  memberId?: string;
  name: string;
  email: string;
  phone?: string;
  flatNo?: string;
  wing?: string;
  avatarUrl?: string;
  maintenanceStatus?: 'paid' | 'pending' | 'overdue';
  outstandingDues?: number;
  emergencyContact?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
    isLoading: true,
  });

  const fetchUserProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; role: UserRole | null }> => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return { profile: null, role: null };
      }

      // Fetch role using RPC function
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      const role: UserRole = roleError || !roleData ? 'user' : (roleData as UserRole);

      const profile: UserProfile = {
        id: profileData.id,
        userId: profileData.user_id,
        memberId: profileData.member_id,
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone,
        flatNo: profileData.flat_no,
        wing: profileData.wing,
        avatarUrl: profileData.avatar_url,
      };

      return { profile, role };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, role: null };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          user: null,
          role: null,
          isLoading: false,
        });
        return;
      }
      
      if (session?.user) {
        // Defer profile fetch to avoid race conditions during SIGNED_IN
        setTimeout(async () => {
          if (!mounted) return;
          const { profile, role } = await fetchUserProfile(session.user.id);
          if (!mounted) return;
          setAuthState({
            isAuthenticated: true,
            user: profile,
            role,
            isLoading: false,
          });
        }, 0);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          role: null,
          isLoading: false,
        });
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const { profile, role } = await fetchUserProfile(session.user.id);
        if (!mounted) return;
        setAuthState({
          isAuthenticated: true,
          user: profile,
          role,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First validate email against Google Sheet
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-sheet-email', {
        body: { email }
      });

      if (validationError || !validationData?.valid) {
        return { 
          success: false, 
          error: validationData?.error || 'Email not found in society records. Please contact your manager.' 
        };
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If user doesn't exist, suggest signup
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid credentials. If you\'re a new user, please sign up first.' 
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Update profile with sheet data if available
        if (validationData.member) {
          await supabase
            .from('profiles')
            .update({
              member_id: validationData.member.memberId || undefined,
              name: validationData.member.name || undefined,
              phone: validationData.member.phone || undefined,
              flat_no: validationData.member.flatNo || undefined,
              wing: validationData.member.wing || undefined,
            })
            .eq('user_id', data.user.id);
        }
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First validate email against Google Sheet
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-sheet-email', {
        body: { email }
      });

      if (validationError || !validationData?.valid) {
        return { 
          success: false, 
          error: validationData?.error || 'Email not found in society records. Only registered society members can sign up.' 
        };
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: validationData.member?.name || name,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Update profile with sheet data
        if (validationData.member) {
          // Wait a moment for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await supabase
            .from('profiles')
            .update({
              member_id: validationData.member.memberId || undefined,
              name: validationData.member.name || name,
              phone: validationData.member.phone || undefined,
              flat_no: validationData.member.flatNo || undefined,
              wing: validationData.member.wing || undefined,
            })
            .eq('user_id', data.user.id);
        }
        return { success: true };
      }

      return { success: false, error: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
      isLoading: false,
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!authState.user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          flat_no: updates.flatNo,
          wing: updates.wing,
          avatar_url: updates.avatarUrl,
        })
        .eq('user_id', authState.user.userId);

      if (error) {
        return { success: false, error: error.message };
      }

      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [authState.user]);

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout, updateProfile }}>
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
