import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Mail, MessageSquarePlus } from 'lucide-react';
import faloodaiLogo from '@/assets/faloodai-logo.png';

const BetaFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Beta Warning Banner */}
        <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-medium text-center">
            This product is currently in <span className="font-bold">BETA PHASE</span>. Features may change and some functionality may be limited.
          </p>
        </div>

        {/* Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Company Info */}
          <div className="flex items-center gap-3">
            <img 
              src={faloodaiLogo} 
              alt="FaloodAI Logo" 
              className="w-8 h-8 object-contain"
            />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">FaloodAI</p>
              <p>A product of <span className="font-medium">Inuberry / SFI Ventures</span></p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              to="/feedback" 
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Request Feature / Report Bug
            </Link>
            <a 
              href="mailto:faloodai@inuberry.com"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              faloodai@inuberry.com
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Inuberry / SFI Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BetaFooter;
