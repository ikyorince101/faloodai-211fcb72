import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile, calculateProfileCompleteness } from '@/hooks/useProfile';
import { useMotion } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';
import { 
  User, Briefcase, Code, FolderOpen, Link as LinkIcon, Plus, X, 
  AlertCircle, Upload, Calendar, Building, Sparkles, Edit2, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WorkHistoryItem {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string | null;
  description?: string;
  highlights?: string[];
}

interface ProjectItem {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string | null;
}

const ProfileHub: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { intensity } = useMotion();
  
  const [fullName, setFullName] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [seniority, setSeniority] = useState('');
  const [location, setLocation] = useState('');
  const [newRole, setNewRole] = useState('');
  const [skills, setSkills] = useState<{ name: string; level: string }[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // Dialog states
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingWorkIndex, setEditingWorkIndex] = useState<number | null>(null);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);

  // Form states for work history
  const [workForm, setWorkForm] = useState<WorkHistoryItem>({
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
  });

  // Form states for projects
  const [projectForm, setProjectForm] = useState<ProjectItem>({
    name: '',
    description: '',
    technologies: [],
    url: '',
  });
  const [newTech, setNewTech] = useState('');
  const [newHighlight, setNewHighlight] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTargetRoles(profile.target_roles || []);
      setSeniority(profile.seniority || '');
      setLocation(profile.location || '');
      setSkills((profile.skills as any[]) || []);
      setWorkHistory((profile.work_history as unknown as WorkHistoryItem[]) || []);
      setProjects((profile.projects as unknown as ProjectItem[]) || []);
    }
  }, [profile]);

  const { percentage, suggestions } = calculateProfileCompleteness(profile);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        target_roles: targetRoles,
        seniority,
        location,
        skills: skills as any,
        work_history: workHistory as any,
        projects: projects as any,
      });
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const addRole = () => {
    if (newRole && !targetRoles.includes(newRole)) {
      setTargetRoles([...targetRoles, newRole]);
      setNewRole('');
    }
  };

  const addSkill = () => {
    if (newSkill && !skills.find(s => s.name === newSkill)) {
      setSkills([...skills, { name: newSkill, level: 'intermediate' }]);
      setNewSkill('');
    }
  };

  // Work History handlers
  const openWorkDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingWorkIndex(index);
      setWorkForm(workHistory[index]);
    } else {
      setEditingWorkIndex(null);
      setWorkForm({ company: '', title: '', startDate: '', endDate: '', description: '', highlights: [] });
    }
    setIsWorkDialogOpen(true);
  };

  const saveWorkHistory = () => {
    if (!workForm.company || !workForm.title) {
      toast.error('Company and title are required');
      return;
    }

    if (editingWorkIndex !== null) {
      const updated = [...workHistory];
      updated[editingWorkIndex] = workForm;
      setWorkHistory(updated);
    } else {
      setWorkHistory([...workHistory, workForm]);
    }
    setIsWorkDialogOpen(false);
  };

  const deleteWorkHistory = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const addHighlight = () => {
    if (newHighlight) {
      setWorkForm({ ...workForm, highlights: [...(workForm.highlights || []), newHighlight] });
      setNewHighlight('');
    }
  };

  // Project handlers
  const openProjectDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingProjectIndex(index);
      setProjectForm(projects[index]);
    } else {
      setEditingProjectIndex(null);
      setProjectForm({ name: '', description: '', technologies: [], url: '' });
    }
    setIsProjectDialogOpen(true);
  };

  const saveProject = () => {
    if (!projectForm.name) {
      toast.error('Project name is required');
      return;
    }

    if (editingProjectIndex !== null) {
      const updated = [...projects];
      updated[editingProjectIndex] = projectForm;
      setProjects(updated);
    } else {
      setProjects([...projects, projectForm]);
    }
    setIsProjectDialogOpen(false);
  };

  const deleteProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const addTech = () => {
    if (newTech && !(projectForm.technologies || []).includes(newTech)) {
      setProjectForm({ ...projectForm, technologies: [...(projectForm.technologies || []), newTech] });
      setNewTech('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", intensity !== 'off' && 'animate-fade-in-up')}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Profile Hub</h1>
          <p className="text-muted-foreground">Your work history, skills, and preferences power smarter prep.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/onboarding')}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Import Resume
        </Button>
      </div>

      {/* Completeness Meter */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Profile Completeness</h3>
          <span className="text-lg font-display font-bold text-primary">{percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs">
                <AlertCircle className="w-3 h-3" /> {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Basic Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Seniority Level</label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select...</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="staff">Staff</option>
              <option value="principal">Principal</option>
              <option value="director">Director</option>
              <option value="vp">VP</option>
              <option value="c-level">C-Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target Roles */}
      <div className="glass-card p-6">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Target Roles
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {targetRoles.map((role, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              {role}
              <button onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRole()}
            placeholder="Add role..."
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={addRole} className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Work History */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Work History
          </h3>
          <Dialog open={isWorkDialogOpen} onOpenChange={setIsWorkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => openWorkDialog()} className="gap-1">
                <Plus className="w-4 h-4" /> Add Position
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingWorkIndex !== null ? 'Edit Position' : 'Add Position'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Company *</label>
                    <input
                      value={workForm.company}
                      onChange={(e) => setWorkForm({ ...workForm, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                    <input
                      value={workForm.title}
                      onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                    <input
                      value={workForm.startDate || ''}
                      onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                      placeholder="YYYY-MM"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                    <input
                      value={workForm.endDate || ''}
                      onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                      placeholder="YYYY-MM or Present"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Description</label>
                  <textarea
                    value={workForm.description || ''}
                    onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Highlights</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(workForm.highlights || []).map((h, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                        {h}
                        <button onClick={() => setWorkForm({ ...workForm, highlights: workForm.highlights?.filter((_, idx) => idx !== i) })}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                      placeholder="Add highlight..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={addHighlight}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsWorkDialogOpen(false)}>Cancel</Button>
                  <Button onClick={saveWorkHistory}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {workHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No work history added yet</p>
            <p className="text-xs mt-1">Add your experience to power smarter prep</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workHistory.map((job, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{job.title}</h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {job.startDate} - {job.endDate || 'Present'}
                      </span>
                    </div>
                    <p className="text-sm text-primary">{job.company}</p>
                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                    )}
                    {job.highlights && job.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.highlights.slice(0, 3).map((h, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                            {h}
                          </span>
                        ))}
                        {job.highlights.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{job.highlights.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openWorkDialog(i)} className="p-1.5 rounded hover:bg-muted">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteWorkHistory(i)} className="p-1.5 rounded hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" /> Projects
          </h3>
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => openProjectDialog()} className="gap-1">
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProjectIndex !== null ? 'Edit Project' : 'Add Project'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Project Name *</label>
                  <input
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Description</label>
                  <textarea
                    value={projectForm.description || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">URL (optional)</label>
                  <input
                    value={projectForm.url || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Technologies</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(projectForm.technologies || []).map((t, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {t}
                        <button onClick={() => setProjectForm({ ...projectForm, technologies: projectForm.technologies?.filter((_, idx) => idx !== i) })}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                      placeholder="Add technology..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={addTech}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
                  <Button onClick={saveProject}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No projects added yet</p>
            <p className="text-xs mt-1">Showcase your work to power smarter prep</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((project, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      {project.name}
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <LinkIcon className="w-3 h-3" />
                        </a>
                      )}
                    </h4>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((t, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openProjectDialog(i)} className="p-1.5 rounded hover:bg-muted">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteProject(i)} className="p-1.5 rounded hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="glass-card p-6">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" /> Skills
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm">
              {skill.name}
              <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Add skill..."
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={addSkill} className="p-2 rounded-lg bg-accent text-accent-foreground">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={updateProfile.isPending}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 glow-primary"
      >
        {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
};

export default ProfileHub;
