import React from 'react';

export const TreeRootsIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2C12 2 14 4 16 6C18 8 20 10 20 12C20 12 18 10 16 12C14 14 12 16 12 16C12 16 10 14 8 12C6 10 4 12 4 12C4 10 6 8 8 6C10 4 12 2 12 2Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 16C12 16 10 18 8 20C6 22 4 22 4 22C4 22 6 20 8 18C10 16 12 16 12 16C12 16 14 16 16 18C18 20 20 22 20 22C20 22 18 22 16 20C14 18 12 16 12 16Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 11C11 13 9 15 7 16M12 11C13 13 15 15 17 16M12 11V16" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default TreeRootsIcon;