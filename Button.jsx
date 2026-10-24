import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1220] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] focus:ring-[#2563EB] border border-[#2563EB]/40 shadow-sm',
    ai: 'bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B1220] font-bold focus:ring-[#06B6D4] border border-[#06B6D4]/50 shadow-sm',
    secondary: 'bg-[#111C2E] hover:bg-[#16243B] text-[#F8FAFC] border border-[#1E293B] hover:border-[#334155] focus:ring-[#2563EB]',
    success: 'bg-[#22C55E] hover:bg-[#16A34A] text-white focus:ring-[#22C55E] border border-[#22C55E]/40',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white focus:ring-[#EF4444] border border-[#EF4444]/40',
    ghost: 'bg-transparent hover:bg-[#16243B] text-[#94A3B8] hover:text-[#F8FAFC] focus:ring-[#2563EB]',
    outline: 'border border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10 focus:ring-[#2563EB]',
    'ai-outline': 'border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 focus:ring-[#06B6D4]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};
export default Button;
