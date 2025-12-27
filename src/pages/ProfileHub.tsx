import React from 'react';
import { User } from 'lucide-react';

const ProfileHub: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
    <div>
      <h1 className="text-3xl font-display font-bold text-foreground">Profile Hub</h1>
      <p className="text-muted-foreground">Your work history, skills, and preferences.</p>
    </div>
    <div className="glass-card p-12 text-center">
      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Complete your profile</h3>
      <p className="text-muted-foreground">Add your work history to power smarter resume and interview prep.</p>
    </div>
  </div>
);

export default ProfileHub;
