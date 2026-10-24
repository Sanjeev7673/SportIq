import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  showPasswordToggle = false,
  rightElement,
  aiFocus = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType && (showPasswordToggle || isPasswordType)
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          type={effectiveType}
          className={`block w-full rounded-xl bg-[#111C2E] border border-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8]/60 text-sm transition-all duration-200 ${
            aiFocus
              ? 'focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4]'
              : 'focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]'
          } ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${(isPasswordType || showPasswordToggle || rightElement) ? 'pr-11' : 'pr-3.5'} py-2.5 ${error ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]' : ''} ${className}`}
          {...props}
        />
        {(isPasswordType || showPasswordToggle) && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#F8FAFC] focus:outline-none transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
        {!isPasswordType && !showPasswordToggle && rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-[#EF4444] font-medium">{error}</p>}
    </div>
  );
};

export default Input;
