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
      className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 transition-all duration-200 ${
        hover ? 'hover:border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] shadow-sm' : ''
      } ${className}`}
      {...props}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-[#ff251f]/10 text-[#ff251f] border border-[#ff251f]/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
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
