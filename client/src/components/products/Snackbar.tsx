import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import type { SnackbarType } from '@/components/products/SnackbarContext';

interface SnackbarProps {
  message: string;
  type: SnackbarType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  type,
  isOpen,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: <CheckCircle className="text-green-500" size={20} />,
      accent: 'bg-green-500',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: <XCircle className="text-red-500" size={20} />,
      accent: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: <AlertCircle className="text-yellow-500" size={20} />,
      accent: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      icon: <Info className="text-primary" size={20} />,
      accent: 'bg-primary',
    },
  };

  const currentStyles = styles[type];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
      <div 
        className={`
          flex items-center gap-4 p-4 rounded-2xl glass-card
          ${currentStyles.bg} ${currentStyles.border}
          animate-slide-in-up pointer-events-auto
          shadow-2xl backdrop-blur-3xl relative overflow-hidden
        `}
      >
        {/* Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${currentStyles.accent}`} />
        
        <div className="shrink-0">
          {currentStyles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-main leading-snug">
            {message}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-text-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Snackbar;
