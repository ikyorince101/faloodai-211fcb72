import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, Key, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotion } from '@/contexts/MotionContext';
import MarketingNav from '@/components/marketing/MarketingNav';
import { cn } from '@/lib/utils';

interface PlanFeature {
  text: string;
  free: boolean | string;
  pro: boolean | string;
}

const planFeatures: PlanFeature[] = [
  { text: 'Job Pipeline Tracker', free: true, pro: true },
  { text: 'STAR Story Bank', free: true, pro: true },
  { text: 'Profile & Skills Management', free: true, pro: true },
  { text: 'Resume Builder', free: 'With your API keys', pro: true },
  { text: 'ATS Resume Optimization', free: 'With your API keys', pro: '100/month' },
  { text: 'AI Mock Interviews', free: 'With your API keys', pro: '10 sessions/month' },
  { text: 'AI Coaching Feedback', free: 'With your API keys', pro: true },
  { text: 'Analytics Dashboard', free: true, pro: true },
  { text: 'Platform AI Keys Included', free: false, pro: true },
  { text: 'Priority Support', free: false, pro: true },
];

const Pricing: React.FC = () => {
  const { intensity } = useMotion();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/3 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px] ${intensity === 'magical' ? 'animate-float' : ''}`} />
          <div className={`absolute top-1/2 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[80px] ${intensity === 'magical' ? 'animate-float' : ''}`} style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className={`text-4xl md:text-5xl font-display font-bold text-foreground mb-4 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}>
            Simple, Transparent Pricing
          </h1>
          <p className={`text-xl text-muted-foreground max-w-2xl mx-auto ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.1s' }}>
            Start free with your own API keys, or go Pro for the full magical experience.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div
            className={cn(
              "glass-card p-8 relative overflow-hidden",
              intensity !== 'off' && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Key className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Free</h3>
                <p className="text-sm text-muted-foreground">Bring Your Own Keys</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <p className="text-muted-foreground mb-6">
              Full access to all features when you connect your own AI API keys (OpenAI, Anthropic, etc).
            </p>

            <Button asChild variant="outline" size="lg" className="w-full mb-8">
              <Link to="/auth">
                Connect Your Keys
              </Link>
            </Button>

            <ul className="space-y-3">
              {planFeatures.slice(0, 5).map((feature) => (
                <li key={feature.text} className="flex items-start gap-3">
                  {feature.free ? (
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span className={feature.free ? 'text-foreground' : 'text-muted-foreground'}>
                    {feature.text}
                    {typeof feature.free === 'string' && (
                      <span className="text-xs text-muted-foreground block">{feature.free}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tier */}
          <div
            className={cn(
              "glass-card p-8 relative overflow-hidden border-primary/50",
              intensity === 'magical' && 'glow-primary',
              intensity !== 'off' && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '0.3s' }}
          >
            {/* Aura Ring Effect */}
            <div className={cn(
              "absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px]",
              intensity === 'magical' && 'animate-pulse-glow'
            )} />
            <div className={cn(
              "absolute -bottom-20 -left-20 w-40 h-40 bg-accent/15 rounded-full blur-[60px]",
              intensity === 'magical' && 'animate-pulse-glow'
            )} style={{ animationDelay: '1s' }} />

            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-aurora flex items-center justify-center",
                intensity === 'magical' && 'glow-accent'
              )}>
                <Zap className="w-6 h-6 text-background" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                <p className="text-sm text-muted-foreground">Full Magic Included</p>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <span className="text-5xl font-bold text-foreground">$20</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <p className="text-muted-foreground mb-6 relative z-10">
              Everything included. No API keys needed. Get 100 ATS generations and 10 interview sessions monthly.
            </p>

            <Button asChild size="lg" className="w-full mb-8 bg-gradient-aurora text-background hover:opacity-90 relative z-10">
              <Link to="/auth">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Pro
              </Link>
            </Button>

            <ul className="space-y-3 relative z-10">
              {planFeatures.slice(0, 5).map((feature) => (
                <li key={feature.text} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    {feature.text}
                    {typeof feature.pro === 'string' && feature.pro !== 'With your API keys' && (
                      <span className="text-xs text-primary block">{feature.pro}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl font-display font-bold text-foreground text-center mb-8 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}>
            Full Feature Comparison
          </h2>

          <div className={`glass-card overflow-hidden ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-foreground font-medium">Feature</th>
                    <th className="text-center p-4 text-foreground font-medium w-32">Free</th>
                    <th className="text-center p-4 text-foreground font-medium w-32 bg-primary/5">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {planFeatures.map((feature, index) => (
                    <tr key={feature.text} className={index < planFeatures.length - 1 ? 'border-b border-border/50' : ''}>
                      <td className="p-4 text-foreground">{feature.text}</td>
                      <td className="p-4 text-center">
                        {feature.free === true ? (
                          <Check className="w-5 h-5 text-success mx-auto" />
                        ) : feature.free === false ? (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center bg-primary/5">
                        {feature.pro === true ? (
                          <Check className="w-5 h-5 text-success mx-auto" />
                        ) : feature.pro === false ? (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-xs text-primary font-medium">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-2xl font-display font-bold text-foreground text-center mb-8 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'What API keys do I need for the Free tier?',
                a: 'You can use OpenAI, Anthropic, or any compatible LLM API key. We provide clear setup instructions once you sign up.',
              },
              {
                q: 'Can I upgrade from Free to Pro anytime?',
                a: 'Yes! You can upgrade at any time and your usage will reset to the Pro limits immediately.',
              },
              {
                q: 'What happens if I exceed my Pro limits?',
                a: 'We\'ll notify you before you hit your limits. You can purchase additional credits or wait until your monthly reset.',
              },
              {
                q: 'Is there a yearly discount?',
                a: 'Coming soon! We\'re working on annual billing with a 20% discount.',
              },
            ].map((faq, index) => (
              <div
                key={faq.q}
                className={`glass-card p-6 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="font-medium text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start free today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-aurora text-background hover:opacity-90 gap-2">
              <Link to="/auth">
                Get Started Free <Sparkles className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-aurora flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-display font-bold text-foreground">FaloodAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FaloodAI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
