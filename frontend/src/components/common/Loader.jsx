import React from 'react';

export const Loader = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-[#2563EB]/20 border-t-[#2563EB] animate-spin mb-3`}
      />
      {message && <p className="text-xs font-medium text-[#94A3B8] tracking-wide">{message}</p>}
    </div>
  );
};
export default Loader;
