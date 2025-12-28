import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotion, MotionIntensity } from '@/contexts/MotionContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const motionOptions: { value: MotionIntensity; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'magical', label: 'Magical' },
];

const MarketingNav: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { intensity, setIntensity, prefersReducedMotion } = useMotion();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-aurora flex items-center justify-center glow-primary">
            <Sparkles className="w-5 h-5 text-background" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">FaloodAI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          
          {/* Motion Intensity Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Motion Intensity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {motionOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setIntensity(option.value)}
                  disabled={prefersReducedMotion}
                  className={cn(
                    intensity === option.value && 'bg-primary/10 text-primary'
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
              {prefersReducedMotion && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  System prefers reduced motion
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <Button asChild className="bg-gradient-aurora text-background hover:opacity-90">
              <Link to="/app">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-aurora text-background hover:opacity-90">
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-4">
          <Link
            to="/pricing"
            className="block text-foreground py-2"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </Link>
          
          {/* Motion Intensity */}
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-2">Motion Intensity</p>
            <div className="flex gap-2">
              {motionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setIntensity(option.value)}
                  disabled={prefersReducedMotion}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    intensity === option.value
                      ? "bg-primary/10 text-primary border border-primary/50"
                      : "bg-secondary text-muted-foreground border border-border"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {user ? (
              <Button asChild className="flex-1 bg-gradient-aurora text-background">
                <Link to="/app" onClick={() => setMobileOpen(false)}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="flex-1 bg-gradient-aurora text-background">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketingNav;
