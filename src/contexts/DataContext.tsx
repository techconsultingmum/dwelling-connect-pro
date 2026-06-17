import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Notice, Complaint, MaintenanceBill, DashboardStats } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/validation';

interface DataContextType {
  members: User[];
  notices: Notice[];
  complaints: Complaint[];
  bills: MaintenanceBill[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  syncFromGoogleSheet: () => Promise<void>;
  addNotice: (notice: Omit<Notice, 'id'>) => Promise<void>;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateComplaintStatus: (id: string, status: Complaint['status']) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Generate a unique ID for demo data
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Demo data
const demoNotices: Notice[] = [
  {
    id: '1',
    title: 'Annual General Meeting',
    description: 'The AGM will be held on 25th January 2026 at 5:00 PM in the society hall. All members are requested to attend.',
    date: '2026-01-10',
    createdBy: 'Rajesh Kumar',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Water Supply Maintenance',
    description: 'Water supply will be interrupted on 20th January from 10 AM to 2 PM due to tank cleaning.',
    date: '2026-01-15',
    createdBy: 'Rajesh Kumar',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Parking Guidelines Update',
    description: 'New parking slots have been allocated. Please check the notice board for your assigned slot.',
    date: '2026-01-12',
    createdBy: 'Rajesh Kumar',
    priority: 'low',
  },
];

const demoComplaints: Complaint[] = [
  {
    id: '1',
    userId: 'USR001',
    userName: 'Priya Sharma',
    flatNo: 'B-205',
    category: 'Plumbing',
    description: 'Water leakage in bathroom ceiling',
    status: 'in-progress',
    createdAt: '2026-01-10T10:30:00',
    updatedAt: '2026-01-12T14:00:00',
  },
  {
    id: '2',
    userId: 'USR002',
    userName: 'Amit Patel',
    flatNo: 'A-302',
    category: 'Electrical',
    description: 'Corridor light not working on 3rd floor',
    status: 'open',
    createdAt: '2026-01-14T09:15:00',
    updatedAt: '2026-01-14T09:15:00',
  },
  {
    id: '3',
    userId: 'USR003',
    userName: 'Sneha Reddy',
    flatNo: 'C-101',
    category: 'Security',
    description: 'CCTV camera near parking not functioning',
    status: 'resolved',
    createdAt: '2026-01-05T16:45:00',
    updatedAt: '2026-01-08T11:30:00',
  },
];

const demoMembers: User[] = [
  {
    memberId: 'USR001',
    name: 'Priya Sharma',
    email: 'priya@email.com',
    phone: '+91 98765 12345',
    flatNo: 'B-205',
    wing: 'B',
    role: 'user',
    maintenanceStatus: 'pending',
    outstandingDues: 5000,
  },
  {
    memberId: 'USR002',
    name: 'Amit Patel',
    email: 'amit@email.com',
    phone: '+91 98765 23456',
    flatNo: 'A-302',
    wing: 'A',
    role: 'user',
    maintenanceStatus: 'paid',
    outstandingDues: 0,
  },
  {
    memberId: 'USR003',
    name: 'Sneha Reddy',
    email: 'sneha@email.com',
    phone: '+91 98765 34567',
    flatNo: 'C-101',
    wing: 'C',
    role: 'user',
    maintenanceStatus: 'overdue',
    outstandingDues: 10000,
  },
  {
    memberId: 'USR004',
    name: 'Vikram Singh',
    email: 'vikram@email.com',
    phone: '+91 98765 45678',
    flatNo: 'A-401',
    wing: 'A',
    role: 'user',
    maintenanceStatus: 'paid',
    outstandingDues: 0,
  },
  {
    memberId: 'USR005',
    name: 'Kavita Joshi',
    email: 'kavita@email.com',
    phone: '+91 98765 56789',
    flatNo: 'B-102',
    wing: 'B',
    role: 'user',
    maintenanceStatus: 'pending',
    outstandingDues: 5000,
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const [members, setMembers] = useState<User[]>(demoMembers);
  const [notices, setNotices] = useState<Notice[]>(demoNotices);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats: DashboardStats = {
    totalMembers: members.length,
    pendingDues: members.filter(m => m.maintenanceStatus !== 'paid').length,
    totalDuesAmount: members.reduce((sum, m) => sum + m.outstandingDues, 0),
    openComplaints: complaints.filter(c => c.status === 'open').length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    recentPayments: members.filter(m => m.maintenanceStatus === 'paid').length,
  };

  const syncFromGoogleSheet = useCallback(async () => {
    // Only sync if authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping sync');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('google-sheets-sync', {
        body: { action: 'read' }
      });

      if (invokeError) {
        console.error('Edge function error:', invokeError);
        throw new Error(invokeError.message || 'Failed to sync data');
      }

      if (data?.success) {
        // Sync members
        if (data.members?.length > 0) {
          setMembers(data.members);
          toast.success(`Synced ${data.members.length} members`);
        }
        
        // Sync bills if available
        if (data.bills?.length > 0) {
          setBills(data.bills);
        }
      } else if (data?.error) {
        // Handle auth errors gracefully
        if (data.error === 'Unauthorized') {
          console.log('Authentication required for data sync');
          return;
        }
        throw new Error(data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync from Google Sheet';
      console.error('Sync error:', errorMessage);
      setError(errorMessage);
      // Don't show toast for auth errors
      if (!errorMessage.includes('Unauthorized')) {
        toast.error('Failed to sync data. Using cached data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // --- Notices ---
  const mapNoticeRow = (r: any): Notice => ({
    id: r.id,
    title: r.title,
    description: r.description,
    date: (r.published_at || r.created_at || '').split('T')[0],
    createdBy: r.created_by_name || 'Manager',
    priority: r.priority,
  });

  const loadNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) {
      console.error('Load notices error:', error);
      return;
    }
    setNotices((data || []).map(mapNoticeRow));
  }, []);

  const addNotice = useCallback(async (notice: Omit<Notice, 'id'>) => {
    if (isDemoMode || !isAuthenticated) {
      const newNotice: Notice = {
        id: generateId(),
        ...notice,
        title: sanitizeText(notice.title),
        description: sanitizeText(notice.description),
      };
      setNotices(prev => [newNotice, ...prev]);
      toast.success('Notice published (demo)');
      return;
    }
    const { error } = await supabase.from('notices').insert({
      title: sanitizeText(notice.title),
      description: sanitizeText(notice.description),
      priority: notice.priority,
      created_by_user_id: user?.userId,
      created_by_name: notice.createdBy || user?.name || 'Manager',
      published_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      toast.error(error.message || 'Failed to publish notice');
      throw error;
    }
    toast.success('Notice published successfully');
  }, [isDemoMode, isAuthenticated, user]);

  // --- Complaints ---
  const mapComplaintRow = (r: any): Complaint => ({
    id: r.id,
    userId: r.member_id || r.user_id,
    userName: r.user_name,
    flatNo: r.flat_no || '',
    category: r.category,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  const loadComplaints = useCallback(async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Load complaints error:', error);
      return;
    }
    setComplaints((data || []).map(mapComplaintRow));
  }, []);

  const addComplaint = useCallback(async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode || !isAuthenticated || !user) {
      const now = new Date().toISOString();
      const newComplaint: Complaint = {
        id: generateId(),
        ...complaint,
        description: sanitizeText(complaint.description),
        createdAt: now,
        updatedAt: now,
      };
      setComplaints(prev => [newComplaint, ...prev]);
      toast.success('Complaint submitted (demo)');
      return;
    }
    const { error } = await supabase.from('complaints').insert({
      user_id: user.userId,
      member_id: user.memberId || complaint.userId || null,
      user_name: complaint.userName || user.name,
      flat_no: complaint.flatNo || user.flatNo || null,
      category: complaint.category,
      description: sanitizeText(complaint.description),
      status: complaint.status || 'open',
    });
    if (error) {
      console.error(error);
      toast.error(error.message || 'Failed to submit complaint');
      throw error;
    }
    toast.success('Complaint submitted successfully');
  }, [isDemoMode, isAuthenticated, user]);

  const updateComplaintStatus = useCallback(async (id: string, status: Complaint['status']) => {
    if (isDemoMode || !isAuthenticated) {
      setComplaints(prev =>
        prev.map(c => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c))
      );
      toast.success(`Complaint marked as ${status}`);
      return;
    }
    const patch: Record<string, any> = { status };
    if (status === 'resolved') {
      patch.resolved_at = new Date().toISOString();
      patch.resolved_by_user_id = user?.userId;
    }
    const { error } = await supabase.from('complaints').update(patch).eq('id', id);
    if (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update complaint');
      throw error;
    }
    toast.success(`Complaint marked as ${status}`);
  }, [isDemoMode, isAuthenticated, user]);

  // Load data when authenticated
  useEffect(() => {
    if (!isAuthenticated || isDemoMode) return;
    syncFromGoogleSheet();
    loadNotices();
    loadComplaints();
  }, [isAuthenticated, isDemoMode, syncFromGoogleSheet, loadNotices, loadComplaints]);

  // Realtime subscriptions
  useEffect(() => {
    if (!isAuthenticated || isDemoMode) return;
    const channel = supabase
      .channel('data-context-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => loadNotices())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => loadComplaints())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isDemoMode, loadNotices, loadComplaints]);

  return (
    <DataContext.Provider value={{
      members,
      notices,
      complaints,
      bills,
      stats,
      isLoading,
      error,
      syncFromGoogleSheet,
      addNotice,
      addComplaint,
      updateComplaintStatus,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}