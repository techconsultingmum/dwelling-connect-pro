import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Shield, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');

    const success = await login(email, password, selectedRole);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 sidebar-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-sidebar-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-sidebar-primary/20 backdrop-blur flex items-center justify-center">
              <Building2 className="w-8 h-8 text-sidebar-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Society ERP</h1>
              <p className="text-sidebar-foreground/60 text-sm">Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Manage Your<br />
            <span className="text-accent">Housing Society</span><br />
            Effortlessly
          </h2>
          
          <p className="text-sidebar-foreground/70 text-lg mb-8 max-w-md">
            Streamline maintenance, payments, complaints, and communication - all in one place.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Secure & Reliable</p>
                <p className="text-sm text-sidebar-foreground/60">Role-based access control</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Easy Communication</p>
                <p className="text-sm text-sidebar-foreground/60">Direct chat with management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Society ERP</h1>
              <p className="text-muted-foreground text-sm">Management System</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole('manager')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                selectedRole === 'manager'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                selectedRole === 'manager' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Shield className="w-5 h-5" />
              </div>
              <p className="font-semibold">Manager</p>
              <p className="text-xs text-muted-foreground">Admin access</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('user')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                selectedRole === 'user'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                selectedRole === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <User className="w-5 h-5" />
              </div>
              <p className="font-semibold">Member</p>
              <p className="text-xs text-muted-foreground">Resident access</p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={!selectedRole || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-primary">Manager:</p>
                <p className="text-muted-foreground">manager@society.com</p>
                <p className="text-muted-foreground">demo123</p>
              </div>
              <div>
                <p className="font-medium text-primary">Member:</p>
                <p className="text-muted-foreground">user@society.com</p>
                <p className="text-muted-foreground">demo123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
