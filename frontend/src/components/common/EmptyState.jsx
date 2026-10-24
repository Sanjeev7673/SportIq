import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No Data Found',
  description = 'There are no records available at this time.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[#1E293B] bg-[#111C2E]/60 ${className}`}>
      <div className="p-4 rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-[#F8FAFC] font-display mb-1">{title}</h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
