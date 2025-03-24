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

  // Initialize default title from video path
  useEffect(() => {
    const filename = videoPath.split(/[\\/]/).pop();
    if (filename) {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      setDefaultTitle(nameWithoutExt);
    }
  }, [videoPath]);

  // Video control functions
  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

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
        if (video.currentTime < trimStart) video.currentTime = trimStart;
        if (video.currentTime > trimEnd) {
          video.currentTime = trimStart;
          if (isPlaying) video.play();
        }
      }
    }
  };

  const handleVideoError = (message: string) => {
    setError(message);
    setIsPlaying(false);
  };

  // Load video duration
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

  const handleTrimHandleMouseDown = () => setIsDragging(true);
  const handleTrimHandleMouseUp = () => setIsDragging(false);

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
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 9L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L23 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.54 8.46C16.48 9.41 17 10.68 17 12C17 13.32 16.48 14.59 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.07 4.93C20.94 6.81 22 9.34 22 12C22 14.66 20.94 17.19 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          handleScrub={(e) => {
            const video = document.querySelector('video');
            if (!video || !video.duration) return;
            const scrubBar = e.currentTarget;
            const rect = scrubBar.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            let newTime = (offsetX / scrubBar.clientWidth) * video.duration;
            const bracketWidthTime = (6 / scrubBar.clientWidth) * video.duration;
            const adjustedTrimEnd = Math.min(trimEnd + bracketWidthTime, video.duration);
            newTime = Math.max(trimStart, Math.min(newTime, adjustedTrimEnd));
            if (isFinite(newTime) && newTime >= 0 && newTime <= video.duration) {
              video.currentTime = newTime;
              setProgress((newTime / video.duration) * 100);
              setCurrentTime(newTime);
            }
          }}
          handleTrimHandleMouseDown={handleTrimHandleMouseDown}
          handleTrimHandleMouseUp={handleTrimHandleMouseUp}
          handleTrimHandleMouseMove={(e) => {
            if (!isDragging || !activeTrimHandle) return;
            const video = document.querySelector('video');
            if (!video) return;
            const scrubBar = e.currentTarget;
            const rect = scrubBar.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
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
          }}
          formatTime={(time) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          }}
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