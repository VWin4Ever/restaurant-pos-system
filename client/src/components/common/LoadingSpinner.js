import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-primary-200 rounded-full animate-pulse`}></div>
        
        {/* Spinning ring */}
        <div className={`${sizeClasses[size]} border-4 border-transparent border-t-primary-600 rounded-full animate-spin absolute top-0 left-0`}></div>
        
        {/* Inner glow */}
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary-100 to-primary-200 rounded-full absolute top-0 left-0 animate-pulse-gentle`}></div>
      </div>
      
      {text && (
        <p className="mt-4 text-sm font-medium text-neutral-600 animate-pulse-gentle">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 