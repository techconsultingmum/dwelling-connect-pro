import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  AlertCircle,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  UserCog,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Members', path: '/members', managerOnly: true },
  { icon: UserCog, label: 'User Management', path: '/admin/users', managerOnly: true },
  { icon: FileText, label: 'Notices', path: '/notices' },
  { icon: AlertCircle, label: 'Complaints', path: '/complaints' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: User, label: 'My Profile', path: '/profile' },
];

// Demo user data for display
const demoUser = {
  name: 'Demo User',
  flatNo: 'A-101',
};

export function Sidebar() {
  const { user, role, logout } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // In demo mode, show as manager to see all features
  const currentRole = isDemoMode ? 'manager' : role;
  const currentUser = isDemoMode ? demoUser : user;

  const filteredNavItems = navItems.filter(
    item => !item.managerOnly || currentRole === 'manager'
  );

  const handleLogout = () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/');
    } else {
      logout();
    }
  };

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Society ERP</h1>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {isDemoMode ? 'Demo Mode' : `${currentRole} Portal`}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <ThemeToggle variant="sidebar" />
        
        <div className="flex items-center gap-3 px-4 py-3 mt-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {currentUser?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser?.flatNo}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>{isDemoMode ? 'Exit Demo' : 'Logout'}</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-sidebar-primary-foreground" aria-hidden="true" />
          </div>
          <span className="font-bold text-sidebar-foreground">Society ERP</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-sidebar-foreground"
          aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-sidebar z-50 flex flex-col transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigation sidebar"
      >
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-72 sidebar-gradient flex-col"
        aria-label="Navigation sidebar"
      >
        <NavContent />
      </aside>
    </>
  );
}
