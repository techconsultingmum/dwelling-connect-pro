import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ProtectedRoute } from './ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
  requireRole?: 'manager' | 'user';
}

export function DashboardLayout({ children, requireRole }: DashboardLayoutProps) {
  return (
    <ProtectedRoute requireRole={requireRole}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
