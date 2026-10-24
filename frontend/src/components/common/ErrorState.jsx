import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Failed to Load Data',
  message = 'An error occurred while communicating with the SportIQ servers.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-[#EF4444]/30 bg-[#111C2E] ${className}`}>
      <div className="p-3.5 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 mb-3">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-[#EF4444] font-display mb-1">{title}</h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};
export default ErrorState;
