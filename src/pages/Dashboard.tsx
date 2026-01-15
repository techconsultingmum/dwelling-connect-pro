import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/stats/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, role } = useAuth();
  const { stats, notices, complaints, bills } = useData();

  const isManager = role === 'manager';

  const userBills = bills.filter(b => b.userId === user?.memberId);
  const userComplaints = complaints.filter(c => c.userId === user?.memberId);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {isManager 
                ? 'Here\'s what\'s happening in your society today.'
                : 'Here\'s your society updates and dues.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notices">
              <Button variant="outline" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">View Notices</span>
              </Button>
            </Link>
            {isManager && (
              <Link to="/members">
                <Button variant="gradient" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Manage Members</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isManager ? (
            <>
              <StatCard
                title="Total Members"
                value={stats.totalMembers}
                icon={Users}
                variant="primary"
              />
              <StatCard
                title="Pending Dues"
                value={stats.pendingDues}
                subtitle={`₹${stats.totalDuesAmount.toLocaleString()} total`}
                icon={IndianRupee}
                variant="warning"
              />
              <StatCard
                title="Open Complaints"
                value={stats.openComplaints}
                icon={AlertCircle}
                variant="destructive"
              />
              <StatCard
                title="Resolved Issues"
                value={stats.resolvedComplaints}
                icon={CheckCircle2}
                variant="success"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Outstanding Dues"
                value={`₹${user?.outstandingDues?.toLocaleString() || 0}`}
                icon={IndianRupee}
                variant={user?.outstandingDues ? 'warning' : 'success'}
              />
              <StatCard
                title="Maintenance Status"
                value={user?.maintenanceStatus || 'N/A'}
                icon={CheckCircle2}
                variant={
                  user?.maintenanceStatus === 'paid' 
                    ? 'success' 
                    : user?.maintenanceStatus === 'overdue'
                    ? 'destructive'
                    : 'warning'
                }
              />
              <StatCard
                title="My Complaints"
                value={userComplaints.length}
                subtitle={`${userComplaints.filter(c => c.status !== 'resolved').length} open`}
                icon={AlertCircle}
                variant="default"
              />
              <StatCard
                title="New Notices"
                value={notices.length}
                icon={FileText}
                variant="primary"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notices */}
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Notices
                </CardTitle>
                <CardDescription>Latest announcements from society</CardDescription>
              </div>
              <Link to="/notices">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {notices.slice(0, 3).map((notice, index) => (
                <div 
                  key={notice.id}
                  className={cn(
                    'p-4 rounded-lg border bg-card transition-all hover:shadow-md',
                    'animate-slide-up'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{notice.title}</h4>
                        <Badge variant={
                          notice.priority === 'high' ? 'destructive' :
                          notice.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {notice.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notice.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(notice.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Complaints Overview */}
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  {isManager ? 'Recent Complaints' : 'My Complaints'}
                </CardTitle>
                <CardDescription>Track and manage complaints</CardDescription>
              </div>
              <Link to="/complaints">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isManager ? complaints : userComplaints).slice(0, 3).map((complaint, index) => (
                <div 
                  key={complaint.id}
                  className={cn(
                    'p-4 rounded-lg border bg-card transition-all hover:shadow-md',
                    'animate-slide-up'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{complaint.category}</Badge>
                        <span 
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            complaint.status === 'open' && 'status-open',
                            complaint.status === 'in-progress' && 'status-progress',
                            complaint.status === 'resolved' && 'status-resolved',
                          )}
                        >
                          {complaint.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {complaint.description}
                      </p>
                      {isManager && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {complaint.userName} • {complaint.flatNo}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(complaint.createdAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {(isManager ? complaints : userComplaints).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No complaints yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions for Users */}
        {!isManager && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/complaints">
              <Card className="p-6 card-hover cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Raise Complaint</h3>
                    <p className="text-sm text-muted-foreground">Report an issue</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/chat">
              <Card className="p-6 card-hover cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Chat with Manager</h3>
                    <p className="text-sm text-muted-foreground">Get quick support</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/payments">
              <Card className="p-6 card-hover cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                    <IndianRupee className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Payments</h3>
                    <p className="text-sm text-muted-foreground">Check bills & dues</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
