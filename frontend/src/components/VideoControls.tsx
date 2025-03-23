import React from 'react';

interface VideoControlsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  togglePlay,
  jumpToStart,
  jumpToEnd
}) => {
  return (
    <div className="flex justify-center items-center gap-4 mb-1">
      <button 
        onClick={jumpToStart}
        className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 17L6 12L11 7M18 17L13 12L18 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button 
        onClick={togglePlay}
        className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" fill="white"/>
            <rect x="14" y="4" width="4" height="16" fill="white"/>
          </svg>
        ) : (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="white"/>
          </svg>
        )}
      </button>

      <button 
        onClick={jumpToEnd}
        className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 17L18 12L13 7M6 17L11 12L6 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default VideoControls;