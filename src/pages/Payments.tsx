import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/stats/StatCard';
import { 
  CreditCard, 
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Payments() {
  const { user, role } = useAuth();
  const { bills, members, stats, isLoading, syncFromGoogleSheet } = useData();

  const isManager = role === 'manager';

  // Filter bills based on user role
  const userBills = isManager 
    ? bills 
    : bills.filter(b => b.userId === user?.memberId);

  const pendingAmount = userBills
    .filter(b => b.status !== 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const paidAmount = userBills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const statusConfig = {
    paid: {
      color: 'bg-success/10 text-success border-success/20',
      icon: CheckCircle2,
    },
    pending: {
      color: 'bg-warning/10 text-warning border-warning/20',
      icon: Clock,
    },
    overdue: {
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertTriangle,
    },
  };

  const handleRefresh = () => {
    syncFromGoogleSheet();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              {isManager ? 'Payment Management' : 'My Payments'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isManager 
                ? 'Track and manage society maintenance payments'
                : 'View your maintenance bills and payment history'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Sync Data
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Statement
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isManager ? (
            <>
              <StatCard
                title="Total Collection"
                value={`₹${(stats.totalDuesAmount + paidAmount).toLocaleString()}`}
                icon={IndianRupee}
                variant="primary"
              />
              <StatCard
                title="Pending Dues"
                value={`₹${stats.totalDuesAmount.toLocaleString()}`}
                subtitle={`${stats.pendingDues} members`}
                icon={Clock}
                variant="warning"
              />
              <StatCard
                title="Collected This Month"
                value={`₹${paidAmount.toLocaleString()}`}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="Payment Rate"
                value={`${stats.totalMembers > 0 ? Math.round((stats.recentPayments / stats.totalMembers) * 100) : 0}%`}
                icon={CheckCircle2}
                variant="default"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Outstanding Dues"
                value={`₹${pendingAmount.toLocaleString()}`}
                icon={IndianRupee}
                variant={pendingAmount > 0 ? 'warning' : 'success'}
              />
              <StatCard
                title="Total Paid"
                value={`₹${paidAmount.toLocaleString()}`}
                icon={CheckCircle2}
                variant="success"
              />
              <StatCard
                title="Current Status"
                value={user?.maintenanceStatus || 'N/A'}
                icon={user?.maintenanceStatus === 'paid' ? CheckCircle2 : Clock}
                variant={
                  user?.maintenanceStatus === 'paid' 
                    ? 'success' 
                    : user?.maintenanceStatus === 'overdue'
                    ? 'destructive'
                    : 'warning'
                }
              />
              <StatCard
                title="Flat No"
                value={user?.flatNo || 'N/A'}
                subtitle={user?.wing ? `Wing ${user.wing}` : undefined}
                icon={Calendar}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isManager ? 'Payment Records' : 'Bill History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isManager && <TableHead>Member</TableHead>}
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    {!isManager && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {isManager && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        {!isManager && <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
                      </TableRow>
                    ))
                  ) : userBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isManager ? 5 : 5} className="text-center py-20">
                        <CreditCard className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium">No payment records</p>
                        <p className="text-muted-foreground">Payment history will appear here once synced from the sheet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    userBills.map((bill, index) => {
                      const config = statusConfig[bill.status];
                      const StatusIcon = config.icon;
                      
                      return (
                        <TableRow 
                          key={bill.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {isManager && (
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">
                                    {members.find(m => m.memberId === bill.userId)?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {members.find(m => m.memberId === bill.userId)?.name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{bill.flatNo}</p>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <span className="font-medium">{bill.month} {bill.year}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">₹{bill.amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(bill.dueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <span 
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit',
                                config.color
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </span>
                          </TableCell>
                          {!isManager && (
                            <TableCell className="text-right">
                              {bill.status !== 'paid' && (
                                <Button size="sm" variant="gradient">
                                  Pay Now
                                </Button>
                              )}
                              {bill.status === 'paid' && (
                                <Button size="sm" variant="outline">
                                  Receipt
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}