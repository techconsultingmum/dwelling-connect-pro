import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Home,
  Save,
  Shield,
  Building2,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { user, role, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    emergencyContact: user?.emergencyContact || '',
  });

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const isManager = role === 'manager';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your personal information
          </p>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-32 sidebar-gradient relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-6 px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <Badge variant={isManager ? 'default' : 'secondary'} className="gap-1">
                    <Shield className="w-3 h-3" />
                    {isManager ? 'Manager' : 'Member'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{user?.memberId}</p>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'gradient'}
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
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
                  value={user?.name || ''}
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
                    value={isEditing ? formData.email : user?.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className={cn('pl-10', !isEditing && 'bg-muted')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={isEditing ? formData.phone : user?.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={cn('pl-10', !isEditing && 'bg-muted')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  placeholder="Enter emergency contact"
                  value={isEditing ? formData.emergencyContact : user?.emergencyContact || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
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
                  <p className="text-xl font-bold">{user?.flatNo}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm text-muted-foreground">Wing</p>
                  <p className="text-xl font-bold">{user?.wing}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance Status</span>
                  <Badge 
                    variant={
                      user?.maintenanceStatus === 'paid' 
                        ? 'default'
                        : user?.maintenanceStatus === 'overdue'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={cn(
                      user?.maintenanceStatus === 'paid' && 'bg-success hover:bg-success/90'
                    )}
                  >
                    {user?.maintenanceStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outstanding Dues</span>
                  <span className={cn(
                    'font-bold',
                    user?.outstandingDues && user.outstandingDues > 0 
                      ? 'text-destructive' 
                      : 'text-success'
                  )}>
                    ₹{user?.outstandingDues?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary font-medium mb-1">Society Address</p>
                <p className="text-sm text-muted-foreground">
                  Harmony Heights Co-operative Housing Society<br />
                  123 Main Street, Sector 15<br />
                  Mumbai, Maharashtra 400001
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end">
            <Button variant="gradient" size="lg" onClick={handleSave}>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
