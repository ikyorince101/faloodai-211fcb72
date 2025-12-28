import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

const CancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-muted-foreground" />
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          Checkout Cancelled
        </h1>

        <p className="text-muted-foreground">
          No worries! You can always upgrade to Pro later when you're ready.
        </p>

        <div className="pt-4 flex gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            View Plans
          </Button>
          <Button 
            onClick={() => navigate('/app')}
          >
            Continue Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;
