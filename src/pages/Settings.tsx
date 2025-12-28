import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useMotion, MotionIntensity } from '@/contexts/MotionContext';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const themeOptions: { value: Theme; label: string; description: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Night Sky', description: 'Default dark theme', icon: Moon },
  { value: 'light', label: 'Light Mode', description: 'Bright and clean', icon: Sun },
];

const motionOptions: { value: MotionIntensity; label: string; description: string }[] = [
  { value: 'off', label: 'Off', description: 'No animations' },
  { value: 'subtle', label: 'Subtle', description: 'Minimal transitions' },
  { value: 'magical', label: 'Magical', description: 'Full experience' },
];

const SettingsPage: React.FC = () => {
  const { intensity, setIntensity, prefersReducedMotion } = useMotion();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      // Fetch all user data
      const [
        { data: profile },
        { data: jobs },
        { data: resumes },
        { data: stories },
        { data: sessions },
        { data: rounds },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('jobs').select('*').eq('user_id', user.id),
        supabase.from('resume_versions').select('*').eq('user_id', user.id),
        supabase.from('stories').select('*').eq('user_id', user.id),
        supabase.from('practice_sessions').select('*').eq('user_id', user.id),
        supabase.from('interview_rounds').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        jobs,
        resumes,
        stories,
        practiceSessions: sessions,
        interviewRounds: rounds,
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faloodai-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);

    try {
      // Delete audio files from storage
      const { data: audioFiles } = await supabase.storage
        .from('audio')
        .list(user.id);
      
      if (audioFiles && audioFiles.length > 0) {
        const filePaths = audioFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('audio').remove(filePaths);
      }

      // First get all practice session IDs to delete related events
      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', user.id);
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase.from('practice_events').delete().in('session_id', sessionIds);
      }

      // Delete all user data (including api_keys, billing, usage)
      await Promise.all([
        supabase.from('practice_sessions').delete().eq('user_id', user.id),
        supabase.from('interview_rounds').delete().eq('user_id', user.id),
        supabase.from('resume_versions').delete().eq('user_id', user.id),
        supabase.from('stories').delete().eq('user_id', user.id),
        supabase.from('jobs').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('user_id', user.id),
        supabase.from('api_keys').delete().eq('user_id', user.id),
        supabase.from('usage_ledger').delete().eq('user_id', user.id),
        supabase.from('billing_subscriptions').delete().eq('user_id', user.id),
        supabase.from('billing_customers').delete().eq('user_id', user.id),
      ]);

      // Sign out
      await signOut();
      toast.success('Account deleted. Goodbye!');
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Customize your FaloodAI experience.</p>
      </div>

      {/* Motion Intensity */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Motion Intensity</h2>
        </div>
        {prefersReducedMotion && (
          <p className="text-sm text-warning mb-4">
            Your system prefers reduced motion. Animations are automatically disabled.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {motionOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setIntensity(option.value)}
              disabled={prefersReducedMotion}
              className={cn(
                "p-4 rounded-xl border transition-all text-left",
                intensity === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50",
                prefersReducedMotion && "opacity-50 cursor-not-allowed"
              )}
            >
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-medium text-foreground">Theme</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left flex items-start gap-3",
                  theme === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/50 hover:border-primary/50"
                )}
              >
                <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Controls */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-success" />
          <h2 className="text-lg font-medium text-foreground">Data Controls</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Export Your Data</p>
              <p className="text-sm text-muted-foreground">Download all your jobs, resumes, stories, and practice data</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-destructive/30">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-medium text-destructive">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10">
          <div>
            <p className="font-medium text-foreground">Delete Account</p>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data including jobs, resumes, stories, and practice sessions will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
