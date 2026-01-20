import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Shield, 
  Users, 
  Search, 
  UserCog,
  Crown,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
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
  role: 'manager' | 'user';
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    newRole: 'manager' | 'user';
  }>({ open: false, user: null, newRole: 'user' });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!confirmDialog.user) return;

    setUpdating(confirmDialog.user.user_id);
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
    <DashboardLayout requireRole="manager">
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
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-500" />
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
                              className={isManager ? 'bg-amber-500 hover:bg-amber-600' : ''}
                            >
                              {isManager ? (
                                <><Crown className="w-3 h-3 mr-1" /> Manager</>
                              ) : (
                                <><User className="w-3 h-3 mr-1" /> Member</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {updating === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                            ) : isCurrentUser ? (
                              <span className="text-xs text-muted-foreground">Cannot modify</span>
                            ) : (
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
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Demote
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Promote
                                  </>
                                )}
                              </Button>
                            )}
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
    </DashboardLayout>
  );
}
