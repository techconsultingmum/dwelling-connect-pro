import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Notice, Complaint, MaintenanceBill, DashboardStats } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  addNotice: (notice: Omit<Notice, 'id'>) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComplaintStatus: (id: string, status: Complaint['status']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Webhook URL for optional integrations (should be moved to env variable in production)
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';

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
  const { isAuthenticated } = useAuth();
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

  const addNotice = useCallback((notice: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      id: generateId(),
      title: sanitizeText(notice.title),
      description: sanitizeText(notice.description),
      date: notice.date,
      createdBy: notice.createdBy,
      priority: notice.priority,
    };
    setNotices(prev => [newNotice, ...prev]);
    toast.success('Notice published successfully');
  }, []);

  const addComplaint = useCallback((complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newComplaint: Complaint = {
      id: generateId(),
      userId: complaint.userId,
      userName: complaint.userName,
      flatNo: complaint.flatNo,
      category: complaint.category,
      description: sanitizeText(complaint.description),
      status: complaint.status,
      createdAt: now,
      updatedAt: now,
    };
    setComplaints(prev => [newComplaint, ...prev]);
    toast.success('Complaint submitted successfully');
  }, []);

  const updateComplaintStatus = useCallback((id: string, status: Complaint['status']) => {
    setComplaints(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, status, updatedAt: new Date().toISOString() }
          : c
      )
    );

    toast.success(`Complaint marked as ${status}`);

    // Send webhook (fire and forget) - only if webhook URL is configured
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaint_status_update',
          complaintId: id,
          status,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail - webhook is optional
      });
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncFromGoogleSheet();
    }
  }, [isAuthenticated, syncFromGoogleSheet]);

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