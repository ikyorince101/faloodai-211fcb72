import React from 'react';
import { FileText, Plus } from 'lucide-react';

const ResumeWorkspace: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Resume Workspace</h1>
        <p className="text-muted-foreground">Create ATS-optimized resume versions for each job.</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-aurora text-background font-medium glow-primary hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" /> New Version
      </button>
    </div>
    <div className="glass-card p-12 text-center">
      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No resumes yet</h3>
      <p className="text-muted-foreground">Upload your base resume to start creating tailored versions.</p>
    </div>
  </div>
);

export default ResumeWorkspace;
