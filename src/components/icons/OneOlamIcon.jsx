import React from 'react';

export const OneOlamIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Globe outline */}
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke={color} 
      strokeWidth="1.5"
    />
    
    {/* Globe meridians */}
    <path 
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke={color} 
      strokeWidth="1.5"
    />
    
    {/* Star of David in center */}
    <path 
      d="M12 7L13.5 9.5H16L14.25 11.25L15 14L12 12.5L9 14L9.75 11.25L8 9.5H10.5L12 7Z" 
      fill={color}
      opacity="0.8"
    />
    <path 
      d="M12 17L10.5 14.5H8L9.75 12.75L9 10L12 11.5L15 10L14.25 12.75L16 14.5H13.5L12 17Z" 
      fill={color}
      opacity="0.8"
    />
  </svg>
);

export default OneOlamIcon;