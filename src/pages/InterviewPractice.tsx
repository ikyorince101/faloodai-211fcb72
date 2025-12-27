import React from 'react';
import { Mic } from 'lucide-react';

const InterviewPractice: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
    <div className="text-center">
      <h1 className="text-3xl font-display font-bold text-foreground">Interview Practice</h1>
      <p className="text-muted-foreground">Mock voice sessions with AI coaching and rubric scoring.</p>
    </div>
    <div className="glass-card p-12 flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 flex items-center justify-center mb-6">
        <Mic className="w-10 h-10 text-accent" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Ready to practice?</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-md">Start a mock interview session. The AI will ask questions, record your answers, and provide spoken coaching.</p>
      <button className="px-6 py-3 rounded-xl bg-gradient-aurora text-background font-medium glow-accent hover:opacity-90 transition-opacity">
        Start Session
      </button>
    </div>
  </div>
);

export default InterviewPractice;
