import React from 'react';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';

const JobTracker: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Job Tracker</h1>
        <p className="text-muted-foreground">Manage your applications, interviews, and follow-ups.</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-aurora text-background font-medium glow-primary hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" /> Add Job
      </button>
    </div>
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Search jobs..." />
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
        <Filter className="w-4 h-4" /> Filter
      </button>
    </div>
    <div className="glass-card p-12 text-center">
      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No jobs tracked yet</h3>
      <p className="text-muted-foreground">Add your first job application to get started.</p>
    </div>
  </div>
);

export default JobTracker;
