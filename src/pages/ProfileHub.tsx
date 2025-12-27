import React, { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, calculateProfileCompleteness } from '@/hooks/useProfile';
import { useMotion } from '@/contexts/MotionContext';
import { cn } from '@/lib/utils';
import { User, Briefcase, Code, FolderOpen, Link as LinkIcon, Plus, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ProfileHub: React.FC = () => {
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

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTargetRoles(profile.target_roles || []);
      setSeniority(profile.seniority || '');
      setLocation(profile.location || '');
      setSkills((profile.skills as any[]) || []);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", intensity !== 'off' && 'animate-fade-in-up')}>
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Profile Hub</h1>
        <p className="text-muted-foreground">Your work history, skills, and preferences power smarter prep.</p>
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
