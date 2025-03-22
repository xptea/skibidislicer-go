import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import TimeDisplay from './TimeDisplay';
import VideoTimeline from './VideoTimeline';
import ExportPanel from './ExportPanel';

const VideoEditorContainer: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTrimHandle, setActiveTrimHandle] = useState<'start' | 'end' | null>(null);
  const videoSrc = "video.mp4";
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpToStart = useCallback(() => {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = trimStart;
      setCurrentTime(trimStart);
      setProgress((trimStart / duration) * 100);
    }
  }, [trimStart, duration]);

  const jumpToEnd = useCallback(() => {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = trimEnd;
      setCurrentTime(trimEnd);
      setProgress((trimEnd / duration) * 100);
    }
  }, [trimEnd, duration]);

  const handleTimeUpdate = () => {
    const video = document.querySelector('video');
    if (video) {
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(video.currentTime);
      
      if (!isDragging) {
        if (video.currentTime < trimStart) {
          video.currentTime = trimStart;
        }
        if (video.currentTime > trimEnd) {
          video.currentTime = trimStart;
          if (isPlaying) video.play();
        }
      }
    }
  };

  const handleScrub = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const video = document.querySelector('video');
    if (!video || !video.duration) return;

    const scrubBar = event.currentTarget;
    const rect = scrubBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newTime = (offsetX / scrubBar.clientWidth) * video.duration;
    
    if (isFinite(newTime) && newTime >= 0 && newTime <= video.duration) {
      const clampedTime = Math.min(Math.max(newTime, 0), video.duration);
      video.currentTime = clampedTime;
      setProgress((clampedTime / video.duration) * 100);
      setCurrentTime(clampedTime);
    }
  };

  const handleTrimHandleMouseDown = (handle: 'start' | 'end') => {
    setActiveTrimHandle(handle);
    setIsDragging(true);
    setIsPlaying(false);
  };

  const handleTrimHandleMouseUp = () => {
    setActiveTrimHandle(null);
    setIsDragging(false);
  };

  const handleTrimHandleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !activeTrimHandle) return;

    const video = document.querySelector('video');
    if (!video) return;

    const scrubBar = event.currentTarget;
    const rect = scrubBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newTime = (offsetX / scrubBar.clientWidth) * duration;

    if (activeTrimHandle === 'start') {
      const newStart = Math.min(Math.max(0, newTime), trimEnd - 0.5);
      setTrimStart(newStart);
      if (currentTime < newStart) {
        video.currentTime = newStart;
        setCurrentTime(newStart);
        setProgress((newStart / duration) * 100);
      }
    } else {
      const newEnd = Math.max(Math.min(duration, newTime), trimStart + 0.5);
      setTrimEnd(newEnd);
      if (currentTime > newEnd) {
        video.currentTime = newEnd;
        setCurrentTime(newEnd);
        setProgress((newEnd / duration) * 100);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVideoError = (message: string) => {
    setError(message);
    setIsPlaying(false);
  };

  useEffect(() => {
    const video = document.querySelector('video');
    if (video) {
      const handleMetadataLoad = () => {
        setDuration(video.duration);
        setTrimEnd(video.duration);
      };
      
      video.addEventListener('loadedmetadata', handleMetadataLoad);
      return () => video.removeEventListener('loadedmetadata', handleMetadataLoad);
    }
  }, []);

  return (
    <div className="flex flex-col w-full">
      {error && (
        <div className="w-full p-3 mb-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-center">
          {error}
        </div>
      )}
      
      <VideoPlayer
        videoSrc={videoSrc}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        trimStart={trimStart}
        trimEnd={trimEnd}
      />

      <div className="w-full bg-black border border-zinc-800 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
        <VideoControls
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          jumpToStart={jumpToStart}
          jumpToEnd={jumpToEnd}
        />

        <TimeDisplay
          currentTime={currentTime}
          duration={duration}
          formatTime={formatTime}
        />

        <VideoTimeline
          progress={progress}
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          videoSrc={videoSrc}
          handleScrub={handleScrub}
          handleTrimHandleMouseDown={handleTrimHandleMouseDown}
          handleTrimHandleMouseUp={handleTrimHandleMouseUp}
          handleTrimHandleMouseMove={handleTrimHandleMouseMove}
          formatTime={formatTime}
        />

        <ExportPanel
          currentTime={currentTime}
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          formatTime={formatTime}
        />
      </div>
    </div>
  );
};

export default VideoEditorContainer;