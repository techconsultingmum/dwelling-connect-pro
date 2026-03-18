import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  Save,
  Shield,
  Building2,
  Edit,
  Loader2,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { phoneSchema } from '@/lib/validation';

const demoProfileUser = {
  memberId: 'DEMO001',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '+91 98765 00000',
  flatNo: '101',
  wing: 'A',
  maintenanceStatus: 'pending' as const,
  outstandingDues: 5000,
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, role, updateProfile, logout, isLoading } = useAuth();
  const { isDemoMode } = useDemo();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const currentUser = isDemoMode ? demoProfileUser : user;
  const isManager = isDemoMode ? true : role === 'manager';

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser]);

  const handleCancelEdit = useCallback(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
      });
    }
    setIsEditing(false);
    setFormErrors({});
  }, [currentUser]);

  const handleSave = async () => {
    setFormErrors({});
    
    if (!formData.name?.trim()) {
      setFormErrors({ name: 'Name is required' });
      return;
    }

    // Validate phone if provided
    if (formData.phone) {
      const phoneResult = phoneSchema.safeParse(formData.phone);
      if (!phoneResult.success) {
        setFormErrors({ phone: 'Please enter a valid Indian phone number' });
        return;
      }
    }

    if (isDemoMode) {
      toast.success('Profile updated (demo mode)');
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    const result = await updateProfile({ name: formData.name.trim(), phone: formData.phone });
    setIsSaving(false);
    
    if (result.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              My Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your personal information
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-32 sidebar-gradient relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-6 px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
                  <Badge variant={isManager ? 'default' : 'secondary'} className="gap-1">
                    <Shield className="w-3 h-3" />
                    {isManager ? 'Manager' : 'Member'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{currentUser?.memberId || 'No Member ID'}</p>
              </div>
              <div className="flex gap-2">
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button
                  variant={isEditing ? 'gradient' : 'outline'}
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={currentUser?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={isEditing ? formData.phone : currentUser?.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setFormErrors({});
                    }}
                    disabled={!isEditing}
                    className={cn('pl-10', !isEditing && 'bg-muted', formErrors.phone && 'border-destructive')}
                    placeholder="+91 98765 43210"
                    maxLength={15}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-id">Member ID</Label>
                <Input
                  id="member-id"
                  value={currentUser?.memberId || 'Not assigned'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          {/* Residence Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Residence Information
              </CardTitle>
              <CardDescription>Your flat and society details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm text-muted-foreground">Flat Number</p>
                  <p className="text-xl font-bold">{currentUser?.flatNo || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm text-muted-foreground">Wing</p>
                  <p className="text-xl font-bold">{currentUser?.wing || 'N/A'}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance Status</span>
                  <Badge 
                    variant={
                      currentUser?.maintenanceStatus === 'paid' 
                        ? 'default'
                        : currentUser?.maintenanceStatus === 'overdue'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={cn(
                      currentUser?.maintenanceStatus === 'paid' && 'bg-success hover:bg-success/90'
                    )}
                  >
                    {currentUser?.maintenanceStatus || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outstanding Dues</span>
                  <span className={cn(
                    'font-bold',
                    currentUser?.outstandingDues && currentUser.outstandingDues > 0 
                      ? 'text-destructive' 
                      : 'text-success'
                  )}>
                    ₹{currentUser?.outstandingDues?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary font-medium mb-1">Society</p>
                <p className="text-sm text-muted-foreground">
                  View society details in Settings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
