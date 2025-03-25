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
  isLooping: boolean;
  onPlaying: (playing: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onError,
  trimStart,
  trimEnd,
  isMuted,
  isLooping,
  onPlaying,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef(0);
  const servedVideoUrl = useMemo(() => {
    const encodedPath = encodeURIComponent(videoSrc);
    return `http://localhost:34115/video/${encodedPath}`;
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => onPlaying(true);
    const handlePause = () => onPlaying(false);
    const handleEnded = () => {
      if (!isLooping) {
        onPlaying(false);
      } else {
        video.currentTime = trimStart;
        video.play();
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isLooping, trimStart, onError, onPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLooping) return;

    const handleSeeked = () => {
      if (isLooping && video.currentTime === trimStart && isPlaying) {
        video.play().catch(err => {
          onError(`Loop playback failed: ${err.message}`);
          onPlaying(false);
        });
      }
    };

    video.addEventListener('seeked', handleSeeked);
    return () => {
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [isLooping, trimStart, isPlaying, onError, onPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play()
        .then(() => onPlaying(true))
        .catch(err => {
          onError(`Playback failed: ${err.message}`);
          onPlaying(false);
        });
    } else {
      video.pause();
      onPlaying(false);
    }
    video.muted = isMuted;
  }, [isPlaying, isMuted, onError, onPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    const now = performance.now();
    
    if (video && Math.abs(video.currentTime - currentTime) > 0.2 && (now - lastUpdateTimeRef.current > 200)) {
      video.currentTime = currentTime;
      lastUpdateTimeRef.current = now;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !isPlaying) {
      if (currentTime < trimStart) {
        video.currentTime = trimStart;
      } else if (currentTime > trimEnd) {
        video.currentTime = trimEnd;
      }
    }
  }, [trimStart, trimEnd, currentTime, isPlaying]);

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
        onError={(e) => onError(`Failed to load video: ${e.nativeEvent.type}`)}
        onLoadedMetadata={handleLoadedMetadata}
        src={servedVideoUrl}
        muted={isMuted}
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;