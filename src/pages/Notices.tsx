import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useData } from '@/contexts/DataContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  FileText, 
  Plus, 
  Calendar,
  User,
  Bell,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notice } from '@/types';
import { z } from 'zod';

const noticeSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  priority: z.enum(['low', 'medium', 'high']),
});

export default function Notices() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const { notices, addNotice } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});
  const [newNotice, setNewNotice] = useState({
    title: '',
    description: '',
    priority: 'medium' as Notice['priority'],
  });

  const isManager = isDemoMode ? true : role === 'manager';
  const currentUser = isDemoMode ? { name: 'Demo Manager' } : user;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = noticeSchema.safeParse(newNotice);
    if (!result.success) {
      const errors: { title?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'title') errors.title = err.message;
        if (err.path[0] === 'description') errors.description = err.message;
      });
      setFormErrors(errors);
      return;
    }

    addNotice({
      title: newNotice.title.trim(),
      description: newNotice.description.trim(),
      priority: newNotice.priority,
      date: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'Manager',
    });
    setNewNotice({ title: '', description: '', priority: 'medium' });
    setIsDialogOpen(false);
  };

  const priorityConfig = {
    high: {
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertTriangle,
      label: 'High Priority',
    },
    medium: {
      color: 'bg-warning/10 text-warning border-warning/20',
      icon: Bell,
      label: 'Medium',
    },
    low: {
      color: 'bg-info/10 text-info border-info/20',
      icon: Info,
      label: 'Low',
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Society Notices
            </h1>
            <p className="text-muted-foreground mt-1">
              {isManager 
                ? 'Create and manage society announcements'
                : 'Stay updated with society announcements'}
            </p>
          </div>
          {isManager && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Notice</DialogTitle>
                  <DialogDescription>
                    This notice will be visible to all society members
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter notice title"
                      value={newNotice.title}
                      onChange={(e) => {
                        setNewNotice({ ...newNotice, title: e.target.value });
                        setFormErrors(prev => ({ ...prev, title: undefined }));
                      }}
                      className={formErrors.title ? 'border-destructive' : ''}
                      maxLength={100}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-destructive">{formErrors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter notice details..."
                      rows={4}
                      value={newNotice.description}
                      onChange={(e) => {
                        setNewNotice({ ...newNotice, description: e.target.value });
                        setFormErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      className={formErrors.description ? 'border-destructive' : ''}
                      maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {formErrors.description ? (
                        <p className="text-destructive">{formErrors.description}</p>
                      ) : (
                        <span></span>
                      )}
                      <span>{newNotice.description.length}/1000</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newNotice.priority}
                      onValueChange={(value: Notice['priority']) => 
                        setNewNotice({ ...newNotice, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setFormErrors({});
                        setNewNotice({ title: '', description: '', priority: 'medium' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="gradient" className="flex-1">
                      Publish Notice
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Notices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice, index) => {
            const config = priorityConfig[notice.priority];
            const PriorityIcon = config.icon;
            
            return (
              <Card 
                key={notice.id}
                className={cn(
                  'card-hover overflow-hidden animate-slide-up',
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5',
                            config.color
                          )}
                        >
                          <PriorityIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-tight">{notice.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {notice.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{notice.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(notice.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {notices.length === 0 && (
          <Card className="py-20">
            <CardContent className="text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No notices yet</p>
              <p className="text-muted-foreground">
                {isManager 
                  ? 'Create your first notice to inform residents'
                  : 'Check back later for society announcements'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
