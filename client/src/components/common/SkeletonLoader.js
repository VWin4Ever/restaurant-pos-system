import React from 'react';

// Skeleton loader components for better loading experience
export const SkeletonCard = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
    <div className="p-6">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded flex-1"></div>
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} className="h-32" />
    ))}
  </div>
);

export const SkeletonChart = ({ height = 300 }) => (
  <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div 
      className="bg-gray-200 rounded"
      style={{ height: `${height}px` }}
    ></div>
  </div>
);

export const SkeletonForm = () => (
  <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="space-y-6">
      <div>
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-1/5 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-10 bg-gray-300 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonUserCard = () => (
  <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-4">
      <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export const SkeletonShiftCard = () => (
  <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-300 rounded w-1/4"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

// Main skeleton loader component
const SkeletonLoader = ({ type = "card", ...props }) => {
  const components = {
    card: SkeletonCard,
    table: SkeletonTable,
    stats: SkeletonStats,
    chart: SkeletonChart,
    form: SkeletonForm,
    list: SkeletonList,
    userCard: SkeletonUserCard,
    shiftCard: SkeletonShiftCard
  };

  const Component = components[type] || SkeletonCard;
  return <Component {...props} />;
};

export default SkeletonLoader;


