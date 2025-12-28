import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Pro!
        </h1>

        <p className="text-muted-foreground">
          Your subscription is now active. You have access to 100 ATS resume generations 
          and 10 mock interview sessions per month.
        </p>

        <div className="pt-4">
          <Button 
            onClick={() => navigate('/app')}
            className="gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
