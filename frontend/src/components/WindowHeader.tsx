import React, { useState, useEffect } from 'react';
import { WindowToggleMaximise, WindowMinimise, Quit } from '../../wailsjs/wailsjs/runtime/runtime';

interface WindowHeaderProps {
  title: string;
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

const WindowHeader: React.FC<WindowHeaderProps> = ({ title, setCurrentPage, currentPage }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [doubleClickTimeout, setDoubleClickTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMinimize = () => {
    WindowMinimise();
  };

  const handleClose = () => {
    Quit();
  };
  
  const handleToggleMaximize = () => {
    WindowToggleMaximise();
    setIsMaximized(!isMaximized);
  };

  const handleHeaderClick = () => {
    if (doubleClickTimeout) {
      clearTimeout(doubleClickTimeout);
      setDoubleClickTimeout(null);
      handleToggleMaximize();
    } else {
      const timeout = setTimeout(() => {
        setDoubleClickTimeout(null);
      }, 300);
      setDoubleClickTimeout(timeout);
    }
  };

  return (
    <div 
      className="flex items-center justify-between h-10 min-h-[40px] flex-shrink-0 bg-black border-b border-zinc-800 px-3 select-none"
      onClick={handleHeaderClick}
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={(e) => {e.stopPropagation(); setCurrentPage('home')}}
          className={`px-3 py-1.5 rounded-lg ${currentPage === 'home' ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'} transition-colors text-xs font-medium text-white`}
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
          Home
        </button>
        
        <button 
          onClick={(e) => {e.stopPropagation(); setCurrentPage('settings')}}
          className={`px-3 py-1.5 rounded-lg ${currentPage === 'settings' ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'} transition-colors text-xs font-medium text-white`}
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
          Settings
        </button>
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-base font-semibold tracking-tight whitespace-nowrap text-white">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => {e.stopPropagation(); handleMinimize()}}
          className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
          <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5.5" width="8" height="1" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        
        {/* <button 
          onClick={(e) => {e.stopPropagation(); handleToggleMaximize()}}
          className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 2H3.5C2.67157 2 2 2.67157 2 3.5V5M7 2H8.5C9.32843 2 10 2.67157 10 3.5V5M2 7V8.5C2 9.32843 2.67157 10 3.5 10H5M10 7V8.5C10 9.32843 9.32843 10 8.5 10H7" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 5V3.5C2 2.67157 2.67157 2 3.5 2H5M7 2H8.5C9.32843 2 10 2.67157 10 3.5V5M2 7V8.5C2 9.32843 2.67157 10 3.5 10H5M10 7V8.5C10 9.32843 9.32843 10 8.5 10H7" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          )}
        </button> */}
        
        <button 
          onClick={(e) => {e.stopPropagation(); handleClose()}}
          className="p-1.5 rounded-md hover:bg-red-900/50 text-zinc-400 hover:text-red-400 transition-colors"
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WindowHeader;