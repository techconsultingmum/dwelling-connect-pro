import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Notice, Complaint, MaintenanceBill, DashboardStats } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface DataContextType {
  members: User[];
  notices: Notice[];
  complaints: Complaint[];
  bills: MaintenanceBill[];
  stats: DashboardStats;
  isLoading: boolean;
  syncFromGoogleSheet: () => Promise<void>;
  addNotice: (notice: Omit<Notice, 'id'>) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComplaintStatus: (id: string, status: Complaint['status']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const WEBHOOK_URL = 'https://wasekom.app.n8n.cloud/webhook-test/HrErpApp';

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
  const [members, setMembers] = useState<User[]>(demoMembers);
  const [notices, setNotices] = useState<Notice[]>(demoNotices);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const stats: DashboardStats = {
    totalMembers: members.length,
    pendingDues: members.filter(m => m.maintenanceStatus !== 'paid').length,
    totalDuesAmount: members.reduce((sum, m) => sum + m.outstandingDues, 0),
    openComplaints: complaints.filter(c => c.status === 'open').length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    recentPayments: members.filter(m => m.maintenanceStatus === 'paid').length,
  };

  const syncFromGoogleSheet = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { action: 'read' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        // Sync members
        if (data.members?.length > 0) {
          setMembers(data.members);
          console.log(`Synced ${data.members.length} members from Google Sheet`);
        }
        
        // Sync bills if available
        if (data.bills?.length > 0) {
          setBills(data.bills);
          console.log(`Synced ${data.bills.length} bills from Google Sheet`);
        }
      } else {
        console.warn('No data returned from sync, using fallback CSV fetch');
        // Fallback to direct CSV fetch
        const response = await fetch('https://docs.google.com/spreadsheets/d/1sQta9o2wRufsm9Kn7I9GRocNDviU-z9YgJb9m6uxIAo/export?format=csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        
        const parsedMembers: User[] = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const memberData: Record<string, string> = {};
          
          headers.forEach((header, i) => {
            memberData[header] = values[i] || '';
          });

          return {
            memberId: memberData.memberid || `USR${String(index + 1).padStart(3, '0')}`,
            name: memberData.name || 'Unknown',
            email: memberData.email || '',
            phone: memberData.phone || '',
            flatNo: memberData.flatno || memberData.flat || '',
            wing: memberData.wing || memberData.building || '',
            role: (memberData.role?.toLowerCase() === 'manager' ? 'manager' : 'user') as 'manager' | 'user',
            maintenanceStatus: (memberData.maintenancestatus?.toLowerCase() || 'pending') as 'paid' | 'pending' | 'overdue',
            outstandingDues: parseFloat(memberData.outstandingdues) || 0,
          };
        });

        if (parsedMembers.length > 0) {
          setMembers(parsedMembers);
        }
      }
    } catch (error) {
      console.error('Failed to sync from Google Sheet:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNotice = useCallback((notice: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...notice,
      id: Date.now().toString(),
    };
    setNotices(prev => [newNotice, ...prev]);
  }, []);

  const addComplaint = useCallback((complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newComplaint: Complaint = {
      ...complaint,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setComplaints(prev => [newComplaint, ...prev]);
  }, []);

  const updateComplaintStatus = useCallback((id: string, status: Complaint['status']) => {
    setComplaints(prev => 
      prev.map(c => 
        c.id === id 
          ? { ...c, status, updatedAt: new Date().toISOString() }
          : c
      )
    );

    // Send webhook
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'complaint_status_update',
        complaintId: id,
        status,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  }, []);

  // Load data on mount
  useEffect(() => {
    syncFromGoogleSheet();
  }, [syncFromGoogleSheet]);

  return (
    <DataContext.Provider value={{
      members,
      notices,
      complaints,
      bills,
      stats,
      isLoading,
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