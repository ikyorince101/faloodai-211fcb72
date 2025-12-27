import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, FileText, Mic, BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const createOptions = [
  { label: 'New Job', icon: Briefcase, path: '/jobs', description: 'Track an application' },
  { label: 'Resume Version', icon: FileText, path: '/resume', description: 'Create tailored resume' },
  { label: 'Practice Session', icon: Mic, path: '/interview', description: 'Start mock interview' },
  { label: 'New Story', icon: BookOpen, path: '/stories', description: 'Add STAR story' },
];

const CreateMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300",
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "hover:opacity-90 glow-primary"
        )}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Create</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-64 z-50 glass-card p-2 animate-fade-in-scale">
            {createOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => handleSelect(option.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-secondary/50 group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <option.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CreateMenu;
