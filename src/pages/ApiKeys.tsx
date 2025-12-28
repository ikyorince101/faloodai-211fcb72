import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useBilling } from '@/hooks/useBilling';
import { toast } from 'sonner';
import { 
  Key, 
  Check, 
  X, 
  Loader2, 
  Shield, 
  CreditCard,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const ApiKeysPage = () => {
  const { keys, isLoading, saveKey, isSaving, validateKey, isValidating, deleteKey, isDeleting, refetch } = useApiKeys();
  const { entitlements, isPro } = useEntitlements();
  const { openCustomerPortal, isLoading: isBillingLoading } = useBilling();

  const [openaiKey, setOpenaiKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [showOpenaiInput, setShowOpenaiInput] = useState(false);
  const [showDeepgramInput, setShowDeepgramInput] = useState(false);

  const openaiKeyInfo = keys.find(k => k.provider === 'openai');
  const deepgramKeyInfo = keys.find(k => k.provider === 'deepgram');

  const handleSaveKey = async (provider: 'openai' | 'deepgram') => {
    const apiKey = provider === 'openai' ? openaiKey : deepgramKey;
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      await saveKey({ provider, apiKey });
      toast.success(`${provider === 'openai' ? 'OpenAI' : 'Deepgram'} key saved and verified`);
      if (provider === 'openai') {
        setOpenaiKey('');
        setShowOpenaiInput(false);
      } else {
        setDeepgramKey('');
        setShowDeepgramInput(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save key');
    }
  };

  const handleValidate = async (provider: string) => {
    try {
      const result = await validateKey(provider);
      if (result.valid) {
        toast.success('Key is valid!');
      } else {
        toast.error('Key validation failed');
      }
    } catch (err) {
      toast.error('Failed to validate key');
    }
  };

  const handleDelete = async (provider: string) => {
    try {
      await deleteKey(provider);
      toast.success('Key deleted');
    } catch (err) {
      toast.error('Failed to delete key');
    }
  };

  const handleManageBilling = async () => {
    const url = await openCustomerPortal();
    if (!url) {
      toast.error('Failed to open billing portal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Plan Status */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Your Plan
                  <Badge variant={isPro ? 'default' : 'secondary'}>
                    {isPro ? 'Pro' : 'Free (BYOK)'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isPro 
                    ? 'You have full access to all features with platform AI keys'
                    : 'Connect your own API keys to use AI features'}
                </CardDescription>
              </div>
            </div>
            {isPro && entitlements?.subscription && (
              <Button variant="outline" onClick={handleManageBilling} disabled={isBillingLoading}>
                {isBillingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Manage Billing
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>
        </CardHeader>
        {isPro && entitlements?.usage && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Resume Generations</p>
                <p className="text-2xl font-bold">
                  {entitlements.usage.resumes.used} / {entitlements.usage.resumes.limit}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Interview Sessions</p>
                <p className="text-2xl font-bold">
                  {entitlements.usage.interviews.used} / {entitlements.usage.interviews.limit}
                </p>
              </div>
            </div>
            {entitlements.subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-4">
                {entitlements.subscription.cancelAtPeriodEnd 
                  ? 'Subscription ends on ' 
                  : 'Renews on '}
                {format(new Date(entitlements.subscription.currentPeriodEnd), 'MMMM d, yyyy')}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* API Keys Section - Only show for free users */}
      {!isPro && (
        <>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <p className="text-sm">
              Your API keys are encrypted and stored securely. They are only used server-side and never exposed to the browser.
            </p>
          </div>

          {/* OpenAI Key */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Key className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">OpenAI API Key</CardTitle>
                    <CardDescription>Required for resume generation and AI coaching</CardDescription>
                  </div>
                </div>
                {openaiKeyInfo ? (
                  <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30">
                    <Check className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <X className="w-3 h-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {openaiKeyInfo ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Key ending in ••••••••</p>
                    {openaiKeyInfo.last_verified_at && (
                      <p className="text-xs text-muted-foreground">
                        Last verified: {format(new Date(openaiKeyInfo.last_verified_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleValidate('openai')}
                      disabled={isValidating}
                    >
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete('openai')}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : showOpenaiInput ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveKey('openai')} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save & Verify
                    </Button>
                    <Button variant="ghost" onClick={() => setShowOpenaiInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowOpenaiInput(true)}>
                  Connect OpenAI Key
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Deepgram Key */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Key className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Deepgram API Key</CardTitle>
                    <CardDescription>Optional - for speech-to-text in mock interviews</CardDescription>
                  </div>
                </div>
                {deepgramKeyInfo ? (
                  <Badge variant="outline" className="gap-1 text-blue-500 border-blue-500/30">
                    <Check className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <X className="w-3 h-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deepgramKeyInfo ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Key ending in ••••••••</p>
                    {deepgramKeyInfo.last_verified_at && (
                      <p className="text-xs text-muted-foreground">
                        Last verified: {format(new Date(deepgramKeyInfo.last_verified_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleValidate('deepgram')}
                      disabled={isValidating}
                    >
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete('deepgram')}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : showDeepgramInput ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="deepgram-key">API Key</Label>
                    <Input
                      id="deepgram-key"
                      type="password"
                      placeholder="Enter your Deepgram API key"
                      value={deepgramKey}
                      onChange={(e) => setDeepgramKey(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveKey('deepgram')} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save & Verify
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDeepgramInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowDeepgramInput(true)}>
                  Connect Deepgram Key
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ApiKeysPage;
