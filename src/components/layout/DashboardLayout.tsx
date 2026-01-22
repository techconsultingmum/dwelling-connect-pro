import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ProtectedRoute } from './ProtectedRoute';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  requireRole?: 'manager' | 'user';
}

export function DashboardLayout({ children, requireRole }: DashboardLayoutProps) {
  const { isDemoMode, exitDemoMode } = useDemo();

  return (
    <ProtectedRoute requireRole={requireRole}>
      <div className="min-h-screen bg-background">
        {isDemoMode && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2 px-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">You're viewing the demo. Data shown is sample data.</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={exitDemoMode}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0"
                    onClick={exitDemoMode}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        <Sidebar />
        <main className={`lg:pl-72 pt-16 lg:pt-0 min-h-screen ${isDemoMode ? 'mt-10' : ''}`}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
