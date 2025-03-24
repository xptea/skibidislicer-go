import React, { useEffect, useRef, useMemo } from 'react';

interface VideoPlayerProps {
  videoSrc: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: () => void;
  onError: (message: string) => void;
  trimStart: number;
  trimEnd: number;
  isMuted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onError,
  trimStart,
  isMuted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const servedVideoUrl = useMemo(() => {
    const encodedPath = encodeURIComponent(videoSrc);
    return `http://localhost:34115/video/${encodedPath}`;
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(err => onError(err.message));
      } else {
        video.pause();
      }
      video.muted = isMuted;
    }
  }, [isPlaying, isMuted, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = trimStart;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-4">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = trimStart;
          }
        }}
        onError={() => onError("Failed to load video")}
        onLoadedMetadata={handleLoadedMetadata}
        src={servedVideoUrl}
        muted={isMuted}
      />
    </div>
  );
};

export default VideoPlayer;