import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Shield, User, Eye, EyeOff, Loader2, UserPlus, LogIn, ArrowLeft, Mail, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, isLoading: authLoading, isAuthenticated } = useAuth();
  const { enterDemoMode } = useDemo();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Clear errors on tab switch
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    const result = await signup(email.trim(), password, name.trim());

    if (result.success) {
      setSuccess('Account created! Please check your email to verify your account before signing in.');
      setActiveTab('login');
      setPassword('');
    } else {
      setError(result.error || 'Signup failed');
    }

    setIsLoading(false);
  };

  const handleViewDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Right Panel - Login/Signup Form */}
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

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {showForgotPassword ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                    <p className="text-muted-foreground">Enter your email to receive a reset link</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          maxLength={255}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm" role="status">
                        {success}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError('');
                        setSuccess('');
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-muted-foreground">Sign in with your registered email</p>
                  </div>

                  {/* Demo Mode Button */}
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full mb-4 gap-2"
                    onClick={handleViewDemo}
                  >
                    <Play className="w-4 h-4" />
                    Try Demo Mode
                  </Button>

                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                      or sign in with email
                    </span>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={255}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setError('');
                            setSuccess('');
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          maxLength={72}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm" role="status">
                        {success}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
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
                </>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                <p className="text-muted-foreground">Sign up with your society-registered email</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your society-registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only emails registered with your society can sign up
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm" role="status">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to the society's terms and conditions.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
