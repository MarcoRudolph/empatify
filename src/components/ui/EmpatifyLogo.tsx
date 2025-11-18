import React from 'react';

/**
 * Fancy styled "Empatify" logo component
 * Designed for 20-40 year old demographic with bold, eye-catching orange styling
 */
export const EmpatifyLogo: React.FC = () => {
  return (
    <div className="relative group">
      {/* Main logo text with gaudy orange styling */}
      <h1 className="text-3xl md:text-4xl font-black tracking-tight select-none">
        <span className="relative inline-block">
          {/* Primary orange text */}
          <span className="text-orange-500 relative z-10">
            Empatify
          </span>
          
          {/* Bold shadow effect for depth */}
          <span className="absolute inset-0 text-orange-600 transform translate-x-1 translate-y-1 -z-10">
            Empatify
          </span>
          
          {/* Additional shadow layer for more depth */}
          <span className="absolute inset-0 text-orange-700 transform translate-x-2 translate-y-2 -z-20">
            Empatify
          </span>
        </span>
      </h1>
      
      {/* Decorative elements */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-300 rounded-full"></div>
      
      {/* Hover effects */}
      <div className="absolute inset-0 bg-orange-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
    </div>
  );
};

export default EmpatifyLogo;












