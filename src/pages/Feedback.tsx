import React, { useState } from 'react';
import { MessageSquarePlus, Bug, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMotion } from '@/contexts/MotionContext';

const Feedback: React.FC = () => {
  const { intensity } = useMotion();
  const [type, setType] = useState<'feature' | 'bug'>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create mailto link
    const subject = encodeURIComponent(`[${type === 'feature' ? 'Feature Request' : 'Bug Report'}] ${title}`);
    const body = encodeURIComponent(
      `Type: ${type === 'feature' ? 'Feature Request' : 'Bug Report'}\n\n` +
      `Title: ${title}\n\n` +
      `Description:\n${description}\n\n` +
      (email ? `Contact Email: ${email}` : '')
    );
    
    window.location.href = `mailto:faloodai@inuberry.com?subject=${subject}&body=${body}`;
    
    setSubmitted(true);
    toast.success('Opening your email client...');
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="glass-card">
          <CardContent className="pt-12 pb-12 text-center">
            <div className={cn(
              "w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6",
              intensity === 'magical' && "glow-accent"
            )}>
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Thank You!
            </h2>
            <p className="text-muted-foreground mb-8">
              Your email client should have opened with the pre-filled message.
              If it didn't, please send your feedback directly to{' '}
              <a href="mailto:faloodai@inuberry.com" className="text-primary hover:underline">
                faloodai@inuberry.com
              </a>
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Request a Feature / Report a Bug
        </h1>
        <p className="text-muted-foreground">
          Help us improve FaloodAI by sharing your feedback or reporting any issues you encounter.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Choose the type of feedback and provide details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Feedback Type</Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => setType(value as 'feature' | 'bug')}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="feature"
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    type === 'feature'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="feature" id="feature" />
                  <MessageSquarePlus className="w-5 h-5 text-primary" />
                  <span className="font-medium">Feature Request</span>
                </Label>
                <Label
                  htmlFor="bug"
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    type === 'bug'
                      ? "border-destructive bg-destructive/10"
                      : "border-border hover:border-destructive/50"
                  )}
                >
                  <RadioGroupItem value="bug" id="bug" />
                  <Bug className="w-5 h-5 text-destructive" />
                  <span className="font-medium">Bug Report</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={type === 'feature' ? 'Brief description of your idea' : 'What went wrong?'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder={
                  type === 'feature'
                    ? 'Describe the feature you would like to see and how it would help you...'
                    : 'Steps to reproduce the bug, expected behavior, and what actually happened...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Your Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="For follow-up questions"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full bg-gradient-aurora text-background hover:opacity-90 gap-2">
              <Send className="w-4 h-4" />
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Direct Contact */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          You can also email us directly at{' '}
          <a href="mailto:faloodai@inuberry.com" className="text-primary hover:underline">
            faloodai@inuberry.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Feedback;
