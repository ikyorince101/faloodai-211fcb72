import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, Key, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotion } from '@/contexts/MotionContext';
import MarketingNav from '@/components/marketing/MarketingNav';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  { text: 'ATS Resume Versions', free: 'With your API keys', pro: '100/month' },
  { text: 'ATS Validation Report', free: 'With your API keys', pro: true },
  { text: 'Voice Mock Interviews', free: 'With your API keys', pro: '10 sessions/month' },
  { text: 'AI Coaching & Debrief Reports', free: 'With your API keys', pro: true },
  { text: 'Analytics Dashboard', free: true, pro: true },
  { text: 'Platform AI Keys Included', free: false, pro: true },
  { text: 'Priority Support', free: false, pro: true },
];

const faqItems = [
  {
    question: 'What is "Bring Your Own Keys" (BYOK)?',
    answer: 'BYOK means you connect your own AI API keys (like OpenAI or Anthropic) to power the resume generation and interview coaching features. You pay for your API usage directly to the provider, and FaloodAI remains free. Your keys are encrypted and only used server-side for your requests.'
  },
  {
    question: 'How do monthly quotas work on Pro?',
    answer: 'Pro includes 100 ATS resume generations and 10 mock interview sessions per billing period. Usage resets at the start of each billing cycle. You can track your remaining credits in the dashboard, and we\'ll notify you when you\'re running low.'
  },
  {
    question: 'What happens when I reach my quota limit?',
    answer: 'When you hit your monthly limit, you\'ll need to wait until your billing cycle resets to generate more resumes or run more interviews. We show your reset date in the app. You can also upgrade your plan if you need higher limits.'
  },
  {
    question: 'Can I cancel my Pro subscription anytime?',
    answer: 'Yes! You can cancel your Pro subscription at any time through the billing portal. Your Pro benefits will continue until the end of your current billing period, then you\'ll switch to the Free tier with your own API keys.'
  },
  {
    question: 'Are my API keys secure?',
    answer: 'Absolutely. Your API keys are encrypted using industry-standard AES-256 encryption before being stored. They\'re only decrypted server-side when making API calls on your behalf. Your keys are never exposed to the frontend or logged anywhere.'
  },
  {
    question: 'What AI providers are supported for BYOK?',
    answer: 'We support OpenAI (GPT-4), Anthropic (Claude), and other OpenAI-compatible providers. For transcription, you can use OpenAI Whisper or compatible alternatives. Setup instructions are provided in the API Keys settings page.'
  },
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
              intensity !== 'off' && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '0.3s' }}
          >
            {/* Animated Aura Rings */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {/* Outer ring */}
              <div className={cn(
                "absolute -inset-4 rounded-full border-2 border-primary/20",
                intensity === 'magical' && 'animate-aura-ring-1'
              )} />
              {/* Middle ring */}
              <div className={cn(
                "absolute -inset-8 rounded-full border border-accent/15",
                intensity === 'magical' && 'animate-aura-ring-2'
              )} />
              {/* Inner glow */}
              <div className={cn(
                "absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px]",
                intensity === 'magical' && 'animate-pulse-glow'
              )} />
              <div className={cn(
                "absolute -bottom-20 -left-20 w-40 h-40 bg-accent/15 rounded-full blur-[60px]",
                intensity === 'magical' && 'animate-pulse-glow'
              )} style={{ animationDelay: '1s' }} />
            </div>

            {/* Hover glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none",
              "bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
            )} />

            <div className="absolute top-4 right-4 z-10">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-aurora flex items-center justify-center",
                intensity === 'magical' && 'animate-shimmer'
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

            <Button asChild size="lg" className="w-full mb-8 bg-gradient-aurora text-background hover:opacity-90 relative z-10 group">
              <Link to="/auth">
                <Sparkles className={cn(
                  "w-4 h-4 mr-2 transition-transform",
                  intensity === 'magical' && 'group-hover:rotate-12 group-hover:scale-110'
                )} />
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

      {/* Key Difference Callout */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className={cn(
            "glass-card p-6 border-2 border-dashed border-border",
            intensity !== 'off' && 'animate-fade-in-up'
          )}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Free: Bring Your Own Keys</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect your own OpenAI/Anthropic API keys. You pay the provider directly for usage. Unlimited generations based on your API quota.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-aurora flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Pro: Platform AI Included</h4>
                  <p className="text-sm text-muted-foreground">
                    No API keys needed! Includes monthly credits: 100 resume generations + 10 mock interview sessions. Priority support included.
                  </p>
                </div>
              </div>
            </div>
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

      {/* FAQ Section with Accordion */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-2xl font-display font-bold text-foreground text-center mb-8 ${intensity !== 'off' ? 'animate-fade-in-up' : ''}`}>
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className={cn(
                  "glass-card border-none px-6 data-[state=open]:ring-2 data-[state=open]:ring-primary/30 transition-all",
                  intensity !== 'off' && 'animate-fade-in-up'
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  <span className="font-medium text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
