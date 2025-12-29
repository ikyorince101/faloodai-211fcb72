import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Shield, 
  MessageSquarePlus, 
  Bug, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useFeedback, FeedbackSubmission } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/loading-spinner';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  in_review: 'bg-primary/20 text-primary border-primary/30',
  resolved: 'bg-success/20 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  in_review: <Eye className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  closed: <XCircle className="w-3 h-3" />,
};

const AdminDashboard: React.FC = () => {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const { submissions, isLoading, updateSubmission, deleteSubmission } = useFeedback();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  const filteredSubmissions = submissions?.filter((sub) => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesType = typeFilter === 'all' || sub.feedback_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) ?? [];

  const stats = {
    total: submissions?.length ?? 0,
    pending: submissions?.filter(s => s.status === 'pending').length ?? 0,
    inReview: submissions?.filter(s => s.status === 'in_review').length ?? 0,
    resolved: submissions?.filter(s => s.status === 'resolved').length ?? 0,
  };

  const handleOpenDetails = (submission: FeedbackSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setNewStatus(submission.status);
  };

  const handleUpdateSubmission = () => {
    if (!selectedSubmission) return;
    
    updateSubmission.mutate({
      id: selectedSubmission.id,
      status: newStatus as FeedbackSubmission['status'],
      admin_notes: adminNotes,
    }, {
      onSuccess: () => {
        setSelectedSubmission(null);
      }
    });
  };

  const handleDeleteSubmission = (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      deleteSubmission.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/20">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage user feedback submissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">{stats.inReview}</div>
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-success">{stats.resolved}</div>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="feature">Features</SelectItem>
                <SelectItem value="bug">Bugs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
          <CardDescription>Click on a row to view details and manage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No submissions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow 
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenDetails(submission)}
                    >
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "gap-1",
                          submission.feedback_type === 'feature' 
                            ? "border-primary/30 text-primary" 
                            : "border-destructive/30 text-destructive"
                        )}>
                          {submission.feedback_type === 'feature' 
                            ? <MessageSquarePlus className="w-3 h-3" />
                            : <Bug className="w-3 h-3" />
                          }
                          {submission.feedback_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {submission.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", statusColors[submission.status])}>
                          {statusIcons[submission.status]}
                          {submission.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(submission.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubmission(submission.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubmission?.feedback_type === 'feature' 
                ? <MessageSquarePlus className="w-5 h-5 text-primary" />
                : <Bug className="w-5 h-5 text-destructive" />
              }
              {selectedSubmission?.title}
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && format(new Date(selectedSubmission.created_at), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <div className="p-4 rounded-lg bg-muted/50 text-foreground whitespace-pre-wrap">
                  {selectedSubmission.description}
                </div>
              </div>

              {/* Contact Email */}
              {selectedSubmission.email && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Email</h4>
                  <a href={`mailto:${selectedSubmission.email}`} className="text-primary hover:underline">
                    {selectedSubmission.email}
                  </a>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateSubmission}
                  disabled={updateSubmission.isPending}
                  className="bg-gradient-aurora text-background"
                >
                  {updateSubmission.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
