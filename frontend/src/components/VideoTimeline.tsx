import React, { useEffect, useRef, useState } from 'react';
import AudioVisualizer from './AudioVisualizer';

interface VideoTimelineProps {
  progress: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  videoSrc: string;
  handleScrub: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleTrimHandleMouseDown: (handle: 'start' | 'end') => void;
  handleTrimHandleMouseUp: () => void;
  handleTrimHandleMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  formatTime: (time: number) => string;
  activeTrimHandle?: 'start' | 'end' | null;
  handleBoxSelection?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({
  progress,
  duration,
  trimStart,
  trimEnd,
  videoSrc,
  handleScrub,
  handleTrimHandleMouseDown,
  handleTrimHandleMouseUp,
  handleTrimHandleMouseMove,
  activeTrimHandle,
  handleBoxSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIndicatorRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(64);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [selectionWidth, setSelectionWidth] = useState(0);
  const [selectionStartPos, setSelectionStartPos] = useState(0);

  useEffect(() => {
    const video = document.querySelector('video');
    if (!video) return;

    let animationFrameId: number;

    const updateProgress = () => {
      if (progressIndicatorRef.current && video.duration) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        progressIndicatorRef.current.style.left = `${progressPercent}%`;
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    updateProgress();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const newWidth = Math.floor(width);
        const newHeight = Math.floor(height);
        if (newWidth !== canvasWidth || newHeight !== canvasHeight) {
          setCanvasWidth(newWidth);
          setCanvasHeight(newHeight);
        }
      }
    };
    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [canvasWidth, canvasHeight]);

  const trimStartPercent = (trimStart / duration) * 100;
  const trimEndPercent = (trimEnd / duration) * 100;
  const rightTrimPosition = trimEndPercent + 0.7;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, handle: 'start' | 'end') => {
    e.stopPropagation();
    handleTrimHandleMouseDown(handle);
  };
  
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsRightMouseDown(true);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        setSelectionStartPos(offsetX / rect.width);
        setSelectionWidth(0);
      }
      return;
    }
    
    setIsMouseDown(true);
    handleScrub(e);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isRightMouseDown && containerRef.current) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const currentPos = offsetX / rect.width;
      const width = currentPos - selectionStartPos;
      setSelectionWidth(width);
      
      if (handleBoxSelection) {
        handleBoxSelection(e);
      }
      return;
    }
    
    if (isMouseDown) {
      handleScrub(e);
    }
    handleTrimHandleMouseMove(e);
  };

  const handleTimelineMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 2) {
      setIsRightMouseDown(false);
      return;
    }
    
    setIsMouseDown(false);
    handleTrimHandleMouseUp();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        setIsRightMouseDown(false);
        return;
      }
      
      if (isMouseDown) {
        setIsMouseDown(false);
        handleTrimHandleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isMouseDown, isRightMouseDown, handleTrimHandleMouseUp]);

  return (
    <div className="relative">
      <div
        className="relative h-16 cursor-pointer select-none"
        ref={containerRef}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUp}
        onMouseLeave={handleTimelineMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div className="absolute inset-0 bg-zinc-900 rounded-lg overflow-hidden">
          <AudioVisualizer videoSrc={videoSrc} progress={progress} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/70 pointer-events-none z-10"
            style={{ width: `${trimStartPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 z-10 bg-black/70 pointer-events-none"
            style={{
              left: `${rightTrimPosition}%`,
              right: 0
            }}
          />
        </div>
        <div
          ref={progressIndicatorRef}
          className="absolute z-20 pointer-events-none"
          style={{
            left: '0%',
            top: '-20%',
            width: '2px',
            height: '120%',
            backgroundColor: 'white',
            boxShadow: '0 0 8px rgba(255,255,255,0.7)',
            transition: isRightMouseDown ? 'none' : activeTrimHandle ? 'transform 0.05s linear' : 'none'
          }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
        </div>
        <div
          className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center"
          style={{ left: `${trimStartPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="flex items-center h-full">
              <div className="h-full w-1 bg-white rounded-l"></div>
              <div className="h-full flex flex-col bg-transparent">
                <div className="h-1 w-1.5 bg-white rounded-tr"></div>
                <div className="flex-grow"></div>
                <div className="h-1 w-1.5 bg-white rounded-br"></div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center"
          style={{ left: `${trimEndPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="flex items-center h-full">
              <div className="h-full flex flex-col bg-transparent">
                <div className="h-1 w-1.5 bg-white rounded-tl"></div>
                <div className="flex-grow"></div>
                <div className="h-1 w-1.5 bg-white rounded-bl"></div>
              </div>
              <div className="h-full w-1 bg-white rounded-r"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTimeline;