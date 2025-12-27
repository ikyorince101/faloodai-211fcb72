import React from 'react';
import { BookOpen, Plus } from 'lucide-react';

const StoryBank: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Story Bank</h1>
        <p className="text-muted-foreground">Save STAR stories once, reuse for resumes and interviews.</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-aurora text-background font-medium glow-primary hover:opacity-90 transition-opacity">
        <Plus className="w-4 h-4" /> Add Story
      </button>
    </div>
    <div className="glass-card p-12 text-center">
      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No stories yet</h3>
      <p className="text-muted-foreground">Add your first STAR story to build your narrative library.</p>
    </div>
  </div>
);

export default StoryBank;
