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
      className={`bg-[#141716] border border-[#303632] rounded-2xl p-6 transition-all duration-200 ${
        hover ? 'hover:border-[#505750] hover:bg-[#1b1f1d]/60 shadow-sm' : ''
      } ${className}`}
      {...props}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#303632]">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-[#ff251f]/10 text-[#ff251f] border border-[#ff251f]/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base sm:text-lg font-bold text-[#f8f6f2] font-display tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[#b7b7b2] mt-0.5">{subtitle}</p>}
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
