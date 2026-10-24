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
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl bg-[#111C2E] border border-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm px-3.5 py-2.5 transition-all duration-200 ${
          error ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="" className="bg-[#111C2E] text-[#94A3B8]">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-[#111C2E] text-[#F8FAFC]">
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
