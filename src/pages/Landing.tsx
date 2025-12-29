import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Target, 
  FileText, 
  Mic, 
  BookOpen, 
  BarChart3, 
  ChevronRight,
  Star,
  Zap,
  Shield,
  AlertTriangle,
  Mail,
  MessageSquarePlus,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotion } from '@/contexts/MotionContext';
import { useAuth } from '@/contexts/AuthContext';
import MarketingNav from '@/components/marketing/MarketingNav';
import faloodaiLogo from '@/assets/faloodai-logo.png';

const features = [
  {
    icon: FileText,
    title: 'ATS-Optimized Resumes',
    description: 'Generate tailored resumes that pass ATS filters with AI-powered keyword optimization.',
  },
  {
    icon: Mic,
    title: 'AI Mock Interviews',
    description: 'Practice with realistic AI-driven interviews and receive instant rubric-based feedback.',
  },
  {
    icon: Target,
    title: 'Job Pipeline Tracker',
    description: 'Organize your applications with a visual Kanban board from saved to offer.',
  },
  {
    icon: BookOpen,
    title: 'STAR Story Bank',
    description: 'Store and refine your best interview stories for consistent, impactful answers.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track your progress with rubric trends, practice streaks, and pipeline metrics.',
  },
  {
    icon: Shield,
    title: 'Your Data, Your Keys',
    description: 'Free tier lets you bring your own API keys. Pro tier includes everything.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer at Google',
    quote: 'FaloodAI helped me land my dream job. The mock interviews were incredibly realistic.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager at Stripe',
    quote: 'The ATS optimization feature doubled my interview callback rate in just two weeks.',
    avatar: 'MJ',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Data Scientist at Meta',
    quote: 'The STAR story bank changed how I prepare. Now I never blank on behavioral questions.',
    avatar: 'ER',
  },
];

const Landing: React.FC = () => {
  const { intensity } = useMotion();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden constellation">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] ${intensity === 'magical' ? 'animate-float' : ''}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px] ${intensity === 'magical' ? 'animate-float' : ''}`} style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Career Coach</span>
          </div>
          
          <h1 className={`text-5xl md:text-7xl font-display font-bold text-foreground mb-6 leading-tight ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.1s' }}>
            Land Your Dream Job
            <br />
            <span className="bg-gradient-aurora bg-clip-text text-transparent">
              With AI Magic
            </span>
          </h1>
          
          <p className={`text-xl text-muted-foreground max-w-2xl mx-auto mb-10 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
            Generate ATS-beating resumes, practice with realistic AI interviews, and track your pipeline—all in one magical workspace.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.3s' }}>
            {user ? (
              <Button asChild size="lg" className="bg-gradient-aurora text-background hover:opacity-90 gap-2 text-lg px-8 glow-primary">
                <Link to="/app">
                  Go to Dashboard <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-aurora text-background hover:opacity-90 gap-2 text-lg px-8 glow-primary">
                  <Link to="/auth">
                    Get Started Free <ChevronRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8">
                  <Link to="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.4s' }}>
            <div>
              <p className="text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground">Job Seekers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">85%</p>
              <p className="text-sm text-muted-foreground">Interview Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">50K+</p>
              <p className="text-sm text-muted-foreground">Resumes Created</p>
            </div>
          </div>
        </div>

        {/* Screenshot Placeholder */}
        <div className={`max-w-5xl mx-auto mt-20 ${intensity !== 'off' ? 'animate-fade-in-scale' : ''}`} style={{ animationDelay: '0.5s' }}>
          <div className="glass-card p-2 rounded-2xl glow-primary">
            <div className="aspect-video bg-gradient-cosmic rounded-xl flex items-center justify-center border border-border/50">
              <div className="text-center">
                <Zap className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                <p className="text-muted-foreground">App Screenshot Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit designed to maximize your chances of landing interviews and offers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`glass-card p-6 hover-halo transition-all ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 ${intensity === 'magical' ? 'glow-primary' : ''}`}>
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              How FaloodAI Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your job search.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Build Your Profile', description: 'Add your skills, experience, and career goals. Store your best STAR stories.' },
              { step: '02', title: 'Generate & Practice', description: 'Create tailored resumes and practice with AI mock interviews.' },
              { step: '03', title: 'Track & Improve', description: 'Monitor your pipeline, review feedback, and iterate to success.' },
            ].map((item, index) => (
              <div
                key={item.step}
                className={`text-center ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-aurora flex items-center justify-center mx-auto mb-6 ${intensity === 'magical' ? 'glow-accent' : ''}`}>
                  <span className="text-2xl font-bold text-background">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Loved by Job Seekers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how FaloodAI has helped thousands land their dream roles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className={`glass-card p-6 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-aurora flex items-center justify-center text-background font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] ${intensity === 'magical' ? 'animate-pulse-glow' : ''}`} />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of job seekers who've transformed their career search with FaloodAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" className="bg-gradient-aurora text-background hover:opacity-90 gap-2 text-lg px-8 glow-primary">
                <Link to="/app">
                  Go to Dashboard <Sparkles className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-aurora text-background hover:opacity-90 gap-2 text-lg px-8 glow-primary">
                  <Link to="/auth">
                    Start Free Today <Sparkles className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8">
                  <Link to="/pricing">
                    Compare Plans
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer with Beta Warning */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          {/* Beta Warning Banner */}
          <div className="flex items-center justify-center gap-2 mb-8 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-warning font-medium text-center">
              This product is currently in <span className="font-bold">BETA PHASE</span>. Features may change and some functionality may be limited.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={faloodaiLogo} alt="FaloodAI Logo" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-display font-bold text-foreground">FaloodAI</span>
                <p className="text-xs text-muted-foreground">A product of Inuberry / SFI Ventures</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              {user ? (
                <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
              )}
              <Link to="/feedback" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquarePlus className="w-4 h-4" />
                Request Feature / Report Bug
              </Link>
              <a href="mailto:faloodai@inuberry.com" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                faloodai@inuberry.com
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Inuberry / SFI Ventures
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
