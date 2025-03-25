import React, { useState, useEffect, useCallback, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import TimeDisplay from './TimeDisplay';
import VideoTimeline from './VideoTimeline';
import ExportPanel from './ExportPanel';

interface VideoEditorContainerProps {
  videoPath: string;
}

const VideoEditorContainer: React.FC<VideoEditorContainerProps> = ({ videoPath }) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTrimHandle, setActiveTrimHandle] = useState<'start' | 'end' | null>(null);
  const [defaultTitle, setDefaultTitle] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const lastScrubTimeRef = useRef(0);
  const scrubThrottleRef = useRef<number | null>(null);
  const initialBoxSelectionRef = useRef({ startTrim: 0, endTrim: 0, mouseX: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isBoxSelectingRef = useRef(false);
  const updatePosAnimFrameRef = useRef<number | null>(null);
  const pendingTimeUpdateRef = useRef<{time: number, immediate: boolean} | null>(null);
  const isProcessingUpdateRef = useRef(false);

  useEffect(() => {
    const filename = videoPath.split(/[\\/]/).pop();
    if (filename) {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      setDefaultTitle(nameWithoutExt);
    }
  }, [videoPath]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setIsPlaying(prev => {
        
        if (prev && video.paused) return false; 
        return !prev;
      });
    } else {
      setIsPlaying(prev => !prev);
    }
  }, []);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => {
      const newState = !prev;
      const video = videoRef.current;
      if (video) {
        video.loop = newState; 
      }
      return newState;
    });
  }, []);

  const jumpToStart = useCallback(() => {
    const video = videoRef.current || document.querySelector('video');
    if (video) {
      video.currentTime = trimStart;
      setCurrentTime(trimStart);
      setProgress((trimStart / duration) * 100);
    }
  }, [trimStart, duration]);

  const jumpToEnd = useCallback(() => {
    const video = videoRef.current || document.querySelector('video');
    if (video) {
      video.currentTime = trimEnd;
      setCurrentTime(trimEnd);
      setProgress((trimEnd / duration) * 100);
    }
  }, [trimEnd, duration]);

  const updateVideoPosition = useCallback((newTime: number, immediate = false) => {
    if (updatePosAnimFrameRef.current) {
      cancelAnimationFrame(updatePosAnimFrameRef.current);
      updatePosAnimFrameRef.current = null;
    }
    
    pendingTimeUpdateRef.current = { time: newTime, immediate };
    
    if (isProcessingUpdateRef.current) return;
    
    const processUpdate = () => {
      isProcessingUpdateRef.current = true;
      
      if (pendingTimeUpdateRef.current) {
        const { time, immediate } = pendingTimeUpdateRef.current;
        pendingTimeUpdateRef.current = null;
        
        const video = videoRef.current || document.querySelector('video');
        if (video && (Math.abs(video.currentTime - time) > 0.05 || immediate)) {
          video.currentTime = time;
          setCurrentTime(time);
          setProgress((time / video.duration) * 100);
        }
      }
      
      if (pendingTimeUpdateRef.current) {
        updatePosAnimFrameRef.current = requestAnimationFrame(processUpdate);
      } else {
        isProcessingUpdateRef.current = false;
      }
    };
    
    updatePosAnimFrameRef.current = requestAnimationFrame(processUpdate);
  }, []);

  const debounceTimer = useRef<number | null>(null);
  
  const debouncedScrub = useCallback((newTime: number, immediate = false) => {
    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
    }
    
    if (immediate) {
      updateVideoPosition(newTime, true);
    } else {
      const now = Date.now();
      if (now - lastScrubTimeRef.current > 80) {
        updateVideoPosition(newTime);
        lastScrubTimeRef.current = now;
      } else {
        debounceTimer.current = window.setTimeout(() => {
          updateVideoPosition(newTime);
          lastScrubTimeRef.current = Date.now();
          debounceTimer.current = null;
        }, 50);
      }
    }
  }, [updateVideoPosition]);

  const handleTimeUpdate = () => {
    const video = videoRef.current || document.querySelector('video');
    if (video) {
      if (!isScrubbing && !isDragging && !isBoxSelectingRef.current) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
        
        if (video.currentTime >= trimEnd) {
          video.currentTime = trimStart;
          if (isPlaying && !video.paused) video.play();
        }
      }
    }
  };

  const handleVideoError = (message: string) => {
    setError(message);
    setIsPlaying(false);
  };

  useEffect(() => {
    const video = document.querySelector('video');
    videoRef.current = video;
    if (video) {
      const handleMetadataLoad = () => {
        setDuration(video.duration);
        setTrimEnd(video.duration);
        video.loop = isLooping;
      };
      video.addEventListener('loadedmetadata', handleMetadataLoad);
      return () => video.removeEventListener('loadedmetadata', handleMetadataLoad);
    }
  }, [isLooping]);

  const handleTrimHandleMouseDown = (handle: 'start' | 'end') => {
    setIsDragging(true);
    setActiveTrimHandle(handle);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };
  
  const handleTrimHandleMouseUp = () => {
    setIsDragging(false);
    setActiveTrimHandle(null);
  };

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsScrubbing(true);
    const video = videoRef.current || document.querySelector('video');
    if (!video || !video.duration) return;
    const scrubBar = e.currentTarget;
    const rect = scrubBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    let newTime = (offsetX / scrubBar.clientWidth) * video.duration;
    newTime = Math.max(trimStart, Math.min(newTime, trimEnd));
    if (isFinite(newTime) && newTime >= 0 && newTime <= video.duration) {
      debouncedScrub(newTime, isMouseDown.current);
    }
    setTimeout(() => setIsScrubbing(false), 100);
  }, [debouncedScrub, trimStart, trimEnd]);

  const isMouseDown = useRef(false);
  const handleMouseDown = useCallback(() => {
    isMouseDown.current = true;
  }, []);
  
  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseUp]);

  const handleBoxSelection = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const video = videoRef.current || document.querySelector('video');
    if (!video || !video.duration) return;
    
    const scrubBar = e.currentTarget;
    const rect = scrubBar.getBoundingClientRect();
    
    if (e.buttons === 2) {
      isBoxSelectingRef.current = true;
      
      if (!initialBoxSelectionRef.current.mouseX) {
        initialBoxSelectionRef.current = {
          startTrim: trimStart,
          endTrim: trimEnd,
          mouseX: e.clientX
        };
      }
      
      const deltaX = e.clientX - initialBoxSelectionRef.current.mouseX;
      const deltaPct = deltaX / rect.width;
      const deltaTime = deltaPct * video.duration;
      
      const trimLength = initialBoxSelectionRef.current.endTrim - initialBoxSelectionRef.current.startTrim;
      let newStart = initialBoxSelectionRef.current.startTrim + deltaTime;
      let newEnd = initialBoxSelectionRef.current.endTrim + deltaTime;
      
      if (newStart < 0) {
        newStart = 0;
        newEnd = newStart + trimLength;
      }
      
      if (newEnd > video.duration) {
        newEnd = video.duration;
        newStart = newEnd - trimLength;
      }
      
      if (newStart >= 0 && newEnd <= video.duration) {
        setTrimStart(newStart);
        setTrimEnd(newEnd);
        
        debouncedScrub(newStart, true);
      }
    }
  }, [trimStart, trimEnd, debouncedScrub]);

  useEffect(() => {
    const handleMouseUp = () => {
      isBoxSelectingRef.current = false;
      initialBoxSelectionRef.current = { startTrim: 0, endTrim: 0, mouseX: 0 };
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="flex flex-col w-full">
      {error && (
        <div className="w-full p-3 mb-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-center">
          {error}
        </div>
      )}

      <div className="relative w-full">
        <VideoPlayer
          videoSrc={videoPath}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          trimStart={trimStart}
          trimEnd={trimEnd}
          isMuted={isMuted}
          isLooping={isLooping}
          onPlaying={setIsPlaying}
        />
      </div>

      <div className="w-full bg-black border border-zinc-800 rounded-lg p-3 sm:p-4 space-y-2">
        <VideoControls
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          jumpToStart={jumpToStart}
          jumpToEnd={jumpToEnd}
        />

        <div className="relative">
          <div className="absolute -top-12 right-1 flex gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-100 hover:text-emerald-400 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 9L17 15" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L23 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.54 8.46C16.48 9.41 17 10.68 17 12C17 13.32 16.48 14.59 15.54 15.54" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.07 4.93C20.94 6.81 22 9.34 22 12C22 14.66 20.94 17.19 19.07 19.07" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <TimeDisplay currentTime={currentTime} duration={duration} formatTime={(time) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }} />

        <VideoTimeline
          progress={progress}
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          videoSrc={videoPath}
          handleScrub={handleScrub}
          handleTrimHandleMouseDown={handleTrimHandleMouseDown}
          handleTrimHandleMouseUp={handleTrimHandleMouseUp}
          handleTrimHandleMouseMove={(e) => {
            if (!isDragging || !activeTrimHandle) return;
            const video = videoRef.current || document.querySelector('video');
            if (!video) return;
            const scrubBar = e.currentTarget;
            const rect = scrubBar.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const newTime = (offsetX / scrubBar.clientWidth) * duration;
            
            if (activeTrimHandle === 'start') {
              const newStart = Math.min(Math.max(0, newTime), trimEnd - 0.5);
              setTrimStart(newStart);
              debouncedScrub(newStart, true);
            } else {
              const newEnd = Math.max(Math.min(duration, newTime), trimStart + 0.5);
              setTrimEnd(newEnd);
              debouncedScrub(newEnd, true);
            }
          }}
          formatTime={(time) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }}
          activeTrimHandle={activeTrimHandle}
          handleBoxSelection={handleBoxSelection}
        />

        <ExportPanel
          currentTime={currentTime}
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          formatTime={(time) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }}
          defaultTitle={defaultTitle}
          videoPath={videoPath}
          isMuted={isMuted}
        />
      </div>
    </div>
  );
};

export default VideoEditorContainer;