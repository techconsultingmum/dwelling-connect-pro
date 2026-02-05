import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { X, Play, LogIn } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDemoMode, exitDemoMode } = useDemo();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">
                You're viewing the demo. Data shown is sample data.
              </span>
              <span className="text-sm font-medium sm:hidden">
                Demo Mode
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="text-xs h-7 gap-1"
                  onClick={exitDemoMode}
                >
                  <LogIn className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link to="/">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0"
                  onClick={exitDemoMode}
                  aria-label="Exit demo and return to home"
                >
                  <X className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      <Sidebar />
      <main 
        className={`lg:pl-72 pt-16 lg:pt-0 min-h-screen transition-[margin-top] duration-200 ${isDemoMode ? 'mt-10' : ''}`}
        role="main"
        id="main-content"
        tabIndex={-1}
      >
        <div className="p-4 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
