import React from 'react';
import logo from '../assets/NutProM_T.png';
import { cn } from "@/lib/utils";

const LoadingScreen = ({ className }) => {
  return (
    <div className={cn(
      "fixed inset-0 flex items-center justify-center bg-background",
      className
    )}>
      <div className="animate-pulse">
        <img 
          src={logo} 
          alt="NutProM Logo" 
          className="w-48 h-48 drop-shadow-lg transition-all duration-500"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.3))'
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
