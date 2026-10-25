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
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#b7b7b2] mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl bg-[#101311] border border-[#303632] text-[#f8f6f2] placeholder-[#b7b7b2]/60 focus:outline-none focus:ring-2 focus:ring-[#ff251f] focus:border-[#ff251f] text-sm px-3.5 py-2.5 transition-all duration-200 ${
          error ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="" className="bg-[#101311] text-[#b7b7b2]">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-[#101311] text-[#f8f6f2]">
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
