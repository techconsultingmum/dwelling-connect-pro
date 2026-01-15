export type UserRole = 'manager' | 'user';

export interface User {
  memberId: string;
  name: string;
  email: string;
  phone: string;
  flatNo: string;
  wing: string;
  role: UserRole;
  maintenanceStatus: 'paid' | 'pending' | 'overdue';
  outstandingDues: number;
  emergencyContact?: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  flatNo: string;
  category: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface MaintenanceBill {
  id: string;
  userId: string;
  flatNo: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  month: string;
  year: number;
}

export interface DashboardStats {
  totalMembers: number;
  pendingDues: number;
  totalDuesAmount: number;
  openComplaints: number;
  resolvedComplaints: number;
  recentPayments: number;
}
