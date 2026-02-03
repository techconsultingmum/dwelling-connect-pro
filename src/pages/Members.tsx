import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/loading-spinner';
import { 
  Users, 
  Search, 
  RefreshCw, 
  UserPlus,
  Phone,
  Mail,
  Home,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/types';

export default function Members() {
  const { role } = useAuth();
  const { isDemoMode } = useDemo();
  const { members, isLoading, syncFromGoogleSheet } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Role check is now handled by App.tsx routes

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return members.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.flatNo.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.wing.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncFromGoogleSheet();
    setIsRefreshing(false);
  };

  const statusColors = {
    paid: 'bg-success/10 text-success border-success/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Members Directory
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage society members and their details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline ml-2">Sync from Sheet</span>
            </Button>
            <Button variant="gradient">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Add Member</span>
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, flat, email, or wing..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredMembers.length} members found</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader text="Loading members..." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Dues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member, index) => (
                      <TableRow 
                        key={member.memberId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => setSelectedMember(member)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.memberId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-muted-foreground" />
                            <span>{member.flatNo}</span>
                            <Badge variant="outline" className="text-xs">
                              Wing {member.wing}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {member.email}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {member.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span 
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium border',
                              statusColors[member.maintenanceStatus]
                            )}
                          >
                            {member.maintenanceStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            'font-semibold',
                            member.outstandingDues > 0 ? 'text-destructive' : 'text-success'
                          )}>
                            ₹{member.outstandingDues.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && filteredMembers.length === 0 && (
              <EmptyState
                icon={Users}
                title="No members found"
                description={searchQuery ? "Try adjusting your search query" : "No members have been added yet"}
                className="py-20"
              />
            )}
          </CardContent>
        </Card>

        {/* Member Detail Dialog */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>View and manage member information</DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedMember.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedMember.name}</h3>
                    <p className="text-muted-foreground">{selectedMember.memberId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Flat No</p>
                    <p className="font-semibold">{selectedMember.flatNo}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Wing</p>
                    <p className="font-semibold">{selectedMember.wing}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <span 
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                        statusColors[selectedMember.maintenanceStatus]
                      )}
                    >
                      {selectedMember.maintenanceStatus}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
                    <p className={cn(
                      'font-semibold',
                      selectedMember.outstandingDues > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      ₹{selectedMember.outstandingDues.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedMember.phone}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Edit Details
                  </Button>
                  <Button variant="gradient" className="flex-1">
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
