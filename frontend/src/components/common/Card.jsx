import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  icon: Icon,
  hover = false,
  ...props
}) => {
  return (
    <div
      className={`bg-[#111C2E] border border-[#1E293B] rounded-2xl p-6 transition-all duration-200 ${
        hover ? 'hover:border-[#334155] hover:bg-[#16243B]/60 shadow-sm' : ''
      } ${className}`}
      {...props}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] font-display tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
export default Card;
