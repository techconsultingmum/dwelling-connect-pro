import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Plus, 
  Clock,
  CheckCircle2,
  Loader2,
  Home,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Complaint } from '@/types';
import { z } from 'zod';
import { toast } from 'sonner';

const categories = [
  'Plumbing',
  'Electrical',
  'Security',
  'Cleaning',
  'Parking',
  'Noise',
  'Structural',
  'Other',
];

const complaintSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
});

export default function Complaints() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const { complaints, addComplaint, updateComplaintStatus } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<{ category?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    category: '',
    description: '',
  });

  const isManager = isDemoMode ? true : role === 'manager';
  const currentUser = isDemoMode ? { memberId: 'DEMO001', name: 'Demo User', flatNo: 'A-101' } : user;

  const userComplaints = isManager 
    ? complaints 
    : complaints.filter(c => c.userId === currentUser?.memberId);

  const filteredComplaints = statusFilter === 'all'
    ? userComplaints
    : userComplaints.filter(c => c.status === statusFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const result = complaintSchema.safeParse(newComplaint);
      if (!result.success) {
        const errors: { category?: string; description?: string } = {};
        result.error.errors.forEach((err) => {
          if (err.path[0] === 'category') errors.category = err.message;
          if (err.path[0] === 'description') errors.description = err.message;
        });
        setFormErrors(errors);
        return;
      }

      addComplaint({
        userId: currentUser?.memberId || '',
        userName: currentUser?.name || '',
        flatNo: currentUser?.flatNo || '',
        category: newComplaint.category,
        description: newComplaint.description.trim(),
        status: 'open',
      });
      setNewComplaint({ category: '', description: '' });
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    open: {
      color: 'status-open',
      icon: AlertCircle,
      label: 'Open',
    },
    'in-progress': {
      color: 'status-progress',
      icon: Loader2,
      label: 'In Progress',
    },
    resolved: {
      color: 'status-resolved',
      icon: CheckCircle2,
      label: 'Resolved',
    },
  };

  const counts = {
    all: userComplaints.length,
    open: userComplaints.filter(c => c.status === 'open').length,
    'in-progress': userComplaints.filter(c => c.status === 'in-progress').length,
    resolved: userComplaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-primary" />
              {isManager ? 'All Complaints' : 'My Complaints'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isManager 
                ? 'Manage and respond to society complaints'
                : 'Track your complaints and requests'}
            </p>
          </div>
          {!isManager && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Raise Complaint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Raise New Complaint</DialogTitle>
                  <DialogDescription>
                    Describe your issue and we'll get back to you soon
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newComplaint.category}
                      onValueChange={(value) => {
                        setNewComplaint({ ...newComplaint, category: value });
                        setFormErrors(prev => ({ ...prev, category: undefined }));
                      }}
                    >
                      <SelectTrigger className={formErrors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-sm text-destructive">{formErrors.category}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your issue in detail (min 10 characters)..."
                      rows={4}
                      value={newComplaint.description}
                      onChange={(e) => {
                        setNewComplaint({ ...newComplaint, description: e.target.value });
                        setFormErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      className={formErrors.description ? 'border-destructive' : ''}
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {formErrors.description ? (
                        <p className="text-destructive">{formErrors.description}</p>
                      ) : (
                        <span></span>
                      )}
                      <span>{newComplaint.description.length}/500</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setFormErrors({});
                        setNewComplaint({ category: '', description: '' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="gradient" 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'open', 'in-progress', 'resolved'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="gap-2"
            >
              {status !== 'all' && (() => {
                const Icon = statusConfig[status as keyof typeof statusConfig].icon;
                return <Icon className="w-4 h-4" />;
              })()}
              <span className="capitalize">{status === 'all' ? 'All' : status.replace('-', ' ')}</span>
              <Badge variant="secondary" className="ml-1">
                {counts[status as keyof typeof counts]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.map((complaint, index) => {
            const config = statusConfig[complaint.status];
            const StatusIcon = config.icon;
            
            return (
              <Card 
                key={complaint.id}
                className="card-hover animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{complaint.category}</Badge>
                        <span 
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5',
                            config.color
                          )}
                        >
                          <StatusIcon className={cn(
                            'w-3 h-3',
                            complaint.status === 'in-progress' && 'animate-spin'
                          )} />
                          {config.label}
                        </span>
                      </div>
                      
                      <p className="text-foreground">{complaint.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {isManager && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              <span>{complaint.userName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Home className="w-4 h-4" />
                              <span>{complaint.flatNo}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isManager && complaint.status !== 'resolved' && (
                      <div className="flex gap-2">
                        {complaint.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateComplaintStatus(complaint.id, 'in-progress')}
                          >
                            Mark In Progress
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredComplaints.length === 0 && (
          <Card className="py-20">
            <CardContent className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No complaints found</p>
              <p className="text-muted-foreground">
                {isManager 
                  ? 'No complaints match your filter criteria'
                  : 'You haven\'t raised any complaints yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
