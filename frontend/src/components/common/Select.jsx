import React from 'react';

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  id,
  placeholder = 'Select an option',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ff251f] focus:border-[#ff251f] text-sm px-3.5 py-2.5 transition-all duration-200 ${
          error ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="" className="bg-[#101311] text-[var(--text-secondary)]">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-[var(--input-bg)] text-[var(--text-primary)]">
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1.5 text-xs text-[#EF4444] font-medium">{error}</p>}
    </div>
  );
};
export default Select;
