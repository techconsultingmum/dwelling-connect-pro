import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Users, 
  Search, 
  UserCog,
  Crown,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  flat_no: string | null;
  wing: string | null;
  phone: string | null;
  member_id: string | null;
  role: 'manager' | 'user';
}

interface EditProfileForm {
  name: string;
  phone: string;
  flat_no: string;
  wing: string;
  member_id: string;
}

// Demo users data
const demoUsers: UserWithRole[] = [
  {
    id: '1',
    user_id: 'demo-001',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    flat_no: '101',
    wing: 'A',
    phone: '+91 98765 43210',
    member_id: 'MGR001',
    role: 'manager',
  },
  {
    id: '2',
    user_id: 'demo-002',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    flat_no: '205',
    wing: 'B',
    phone: '+91 98765 12345',
    member_id: 'USR001',
    role: 'user',
  },
  {
    id: '3',
    user_id: 'demo-003',
    name: 'Amit Patel',
    email: 'amit@example.com',
    flat_no: '302',
    wing: 'A',
    phone: '+91 98765 23456',
    member_id: 'USR002',
    role: 'user',
  },
  {
    id: '4',
    user_id: 'demo-004',
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    flat_no: '101',
    wing: 'C',
    phone: '+91 98765 34567',
    member_id: 'USR003',
    role: 'user',
  },
  {
    id: '5',
    user_id: 'demo-005',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    flat_no: '401',
    wing: 'A',
    phone: '+91 98765 45678',
    member_id: 'MGR002',
    role: 'manager',
  },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { isDemoMode } = useDemo();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    newRole: 'manager' | 'user';
  }>({ open: false, user: null, newRole: 'user' });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
  }>({ open: false, user: null });
  const [editForm, setEditForm] = useState<EditProfileForm>({
    name: '', phone: '', flat_no: '', wing: '', member_id: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    // In demo mode, use demo data
    if (isDemoMode) {
      setTimeout(() => {
        setUsers(demoUsers);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setFetchError('Failed to fetch users. Please try again.');
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isDemoMode]);

  const handleRoleChange = async () => {
    if (!confirmDialog.user) return;

    setUpdating(confirmDialog.user.user_id);
    
    // In demo mode, just update local state
    if (isDemoMode) {
      setTimeout(() => {
        toast.success(`${confirmDialog.user?.name} has been ${confirmDialog.newRole === 'manager' ? 'promoted to Manager' : 'demoted to Member'}`);
        setUsers(prev => prev.map(u => 
          u.user_id === confirmDialog.user?.user_id 
            ? { ...u, role: confirmDialog.newRole }
            : u
        ));
        setUpdating(null);
        setConfirmDialog({ open: false, user: null, newRole: 'user' });
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        body: { 
          action: 'update',
          targetUserId: confirmDialog.user.user_id,
          role: confirmDialog.newRole
        }
      });

      if (error) throw error;
      
      toast.success(data.message || 'Role updated successfully');
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === confirmDialog.user?.user_id 
          ? { ...u, role: confirmDialog.newRole }
          : u
      ));
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdating(null);
      setConfirmDialog({ open: false, user: null, newRole: 'user' });
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      flat_no: user.flat_no || '',
      wing: user.wing || '',
      member_id: user.member_id || '',
    });
    setEditDialog({ open: true, user });
  };

  const handleSaveProfile = async () => {
    if (!editDialog.user) return;
    setIsSavingProfile(true);

    if (isDemoMode) {
      setTimeout(() => {
        setUsers(prev => prev.map(u =>
          u.user_id === editDialog.user?.user_id
            ? { ...u, name: editForm.name, phone: editForm.phone, flat_no: editForm.flat_no, wing: editForm.wing, member_id: editForm.member_id }
            : u
        ));
        setEditDialog({ open: false, user: null });
        setIsSavingProfile(false);
        toast.success('Profile updated (demo mode)');
      }, 500);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-user-role', {
        body: {
          action: 'update-profile',
          targetUserId: editDialog.user.user_id,
          profileUpdates: {
            name: editForm.name,
            phone: editForm.phone,
            flat_no: editForm.flat_no,
            wing: editForm.wing,
            member_id: editForm.member_id,
          },
        },
      });

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.user_id === editDialog.user?.user_id
          ? { ...u, name: editForm.name, phone: editForm.phone, flat_no: editForm.flat_no, wing: editForm.wing, member_id: editForm.member_id }
          : u
      ));
      setEditDialog({ open: false, user: null });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.flat_no?.toLowerCase().includes(query)
    );
  });

  const managers = users.filter(u => u.role === 'manager');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{managers.length}</p>
                  <p className="text-sm text-muted-foreground">Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{regularUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              All Users
            </CardTitle>
            <CardDescription>
              Click on a user's role to promote or demote them
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetchError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={fetchUsers} className="ml-auto">
                  Retry
                </Button>
              </div>
            )}
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const isCurrentUser = user.user_id === currentUser?.userId;
                      const isManager = user.role === 'manager';

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {user.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.name || 'Unknown'}
                                  {isCurrentUser && (
                                    <span className="text-xs text-muted-foreground ml-2">(You)</span>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.flat_no && user.wing 
                              ? `${user.wing}-${user.flat_no}` 
                              : user.flat_no || '-'}
                          </TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={isManager ? 'default' : 'secondary'}
                              className={isManager ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}
                            >
                              {isManager ? (
                                <><Crown className="w-3 h-3 mr-1" /> Manager</>
                              ) : (
                                <><User className="w-3 h-3 mr-1" /> Member</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {updating === user.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(user)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  {!isCurrentUser && (
                                    <Button
                                      variant={isManager ? 'outline' : 'default'}
                                      size="sm"
                                      onClick={() => setConfirmDialog({
                                        open: true,
                                        user,
                                        newRole: isManager ? 'user' : 'manager'
                                      })}
                                    >
                                      {isManager ? (
                                        <><XCircle className="w-4 h-4 mr-1" /> Demote</>
                                      ) : (
                                        <><CheckCircle2 className="w-4 h-4 mr-1" /> Promote</>
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.newRole === 'manager' ? 'Promote to Manager' : 'Demote to Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newRole === 'manager' 
                ? `Are you sure you want to promote ${confirmDialog.user?.name || confirmDialog.user?.email} to Manager? They will have full administrative access.`
                : `Are you sure you want to demote ${confirmDialog.user?.name || confirmDialog.user?.email} to Member? They will lose administrative access.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              {confirmDialog.newRole === 'manager' ? 'Promote' : 'Demote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => 
        setEditDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
            <DialogDescription>
              Update details for {editDialog.user?.name || editDialog.user?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                maxLength={20}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-flat">Flat No</Label>
                <Input
                  id="edit-flat"
                  value={editForm.flat_no}
                  onChange={(e) => setEditForm(prev => ({ ...prev, flat_no: e.target.value }))}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wing">Wing</Label>
                <Input
                  id="edit-wing"
                  value={editForm.wing}
                  onChange={(e) => setEditForm(prev => ({ ...prev, wing: e.target.value }))}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-member-id">Member ID</Label>
              <Input
                id="edit-member-id"
                value={editForm.member_id}
                onChange={(e) => setEditForm(prev => ({ ...prev, member_id: e.target.value }))}
                maxLength={20}
                placeholder="USR001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })} disabled={isSavingProfile}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
