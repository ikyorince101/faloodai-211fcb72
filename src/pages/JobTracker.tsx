import React, { useState } from 'react';
import { useJobsWithCounts, useCreateJob, useUpdateJob, useDeleteJob, JobStage } from '@/hooks/useJobs';
import { useMotion } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, Filter, LayoutGrid, List, 
  Briefcase, FileText, MessageSquare, Mic,
  MoreHorizontal, Trash2, ExternalLink, GripVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const stageColumns: { key: JobStage; label: string; color: string }[] = [
  { key: 'saved', label: 'Saved', color: 'bg-muted-foreground' },
  { key: 'applied', label: 'Applied', color: 'bg-accent' },
  { key: 'screening', label: 'Screening', color: 'bg-primary' },
  { key: 'technical', label: 'Technical', color: 'bg-primary' },
  { key: 'onsite', label: 'Onsite', color: 'bg-success' },
  { key: 'offer', label: 'Offer', color: 'bg-success' },
];

interface JobCardProps {
  job: any;
  onDragStart: (e: React.DragEvent, jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onDragStart }) => {
  const { intensity } = useMotion();
  const [showMenu, setShowMenu] = useState(false);
  const deleteJob = useDeleteJob();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this job?')) {
      await deleteJob.mutateAsync(job.id);
      toast.success('Job deleted');
    }
  };

  return (
    <Link
      to={`/jobs/${job.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, job.id)}
      className={cn(
        "block glass-card p-4 hover-halo cursor-grab active:cursor-grabbing",
        "transition-all duration-200 group",
        intensity === 'magical' && 'hover:scale-[1.02]'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-50" />
          <div>
            <h4 className="font-medium text-foreground text-sm">{job.company}</h4>
            <p className="text-xs text-muted-foreground">{job.title}</p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-32 glass-card p-1 z-20">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {job.applied_at && (
        <p className="text-xs text-muted-foreground mb-2">
          Applied {format(new Date(job.applied_at), 'MMM d')}
        </p>
      )}
      
      {/* Artifact chips */}
      <div className="flex gap-1.5 flex-wrap">
        {job.resumeCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
            <FileText className="w-3 h-3" /> {job.resumeCount}
          </span>
        )}
        {job.roundCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
            <MessageSquare className="w-3 h-3" /> {job.roundCount}
          </span>
        )}
        {job.sessionCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
            <Mic className="w-3 h-3" /> {job.sessionCount}
          </span>
        )}
      </div>
    </Link>
  );
};

const JobTracker: React.FC = () => {
  const [view, setView] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: jobs = [], isLoading } = useJobsWithCounts();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const { intensity } = useMotion();

  const filteredJobs = jobs.filter(job => 
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
  };

  const handleDrop = async (e: React.DragEvent, stage: JobStage) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      await updateJob.mutateAsync({ id: jobId, stage });
      toast.success(`Moved to ${stage}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", intensity !== 'off' && 'animate-fade-in-up')}>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Job Tracker</h1>
          <p className="text-muted-foreground">Manage your applications and interviews.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium glow-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" 
            placeholder="Search jobs..." 
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('board')}
            className={cn(
              "p-2.5 rounded-xl border transition-colors",
              view === 'board' ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('table')}
            className={cn(
              "p-2.5 rounded-xl border transition-colors",
              view === 'table' ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No jobs tracked yet</h3>
          <p className="text-muted-foreground mb-4">Add your first job application to get started.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Add Job
          </button>
        </div>
      ) : view === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageColumns.map(stage => {
            const stageJobs = filteredJobs.filter(j => j.stage === stage.key);
            return (
              <div 
                key={stage.key}
                onDrop={(e) => handleDrop(e, stage.key)}
                onDragOver={handleDragOver}
                className="flex-shrink-0 w-72"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">({stageJobs.length})</span>
                </div>
                <div className="space-y-3 min-h-[200px] p-2 rounded-xl bg-secondary/20 border border-border/50">
                  {stageJobs.map(job => (
                    <JobCard key={job.id} job={job} onDragStart={handleDragStart} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stage</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applied</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Artifacts</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <Link to={`/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary">
                      {job.company}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{job.title}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      stageColumns.find(s => s.key === job.stage)?.color,
                      "text-background"
                    )}>
                      {job.stage}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {job.applied_at ? format(new Date(job.applied_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      {job.resumeCount > 0 && <span className="text-xs text-primary">{job.resumeCount}R</span>}
                      {job.roundCount > 0 && <span className="text-xs text-accent">{job.roundCount}I</span>}
                      {job.sessionCount > 0 && <span className="text-xs text-success">{job.sessionCount}P</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link to={`/jobs/${job.id}`} className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <AddJobModal onClose={() => setShowAddModal(false)} onCreate={createJob.mutateAsync} />
      )}
    </div>
  );
};

const AddJobModal: React.FC<{ onClose: () => void; onCreate: (job: any) => Promise<any> }> = ({ onClose, onCreate }) => {
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !title) return;
    setLoading(true);
    try {
      await onCreate({ company, title, url: url || null });
      toast.success('Job added');
      onClose();
    } catch (err) {
      toast.error('Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 animate-fade-in-scale">
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">Add Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Company *</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Google"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Job Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Job URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !company || !title}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Adding...' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobTracker;
