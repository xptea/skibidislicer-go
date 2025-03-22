import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoSrc: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: () => void;
  onError: (message: string) => void;
  trimStart: number;
  trimEnd: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSrc,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = async () => {
      try {
        if (isPlaying) {
          await video.play();
        } else {
          video.pause();
        }
      } catch (err) {
        onError('Error playing video');
      }
    };

    handlePlay();
  }, [isPlaying, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playsInline = true;
    video.preload = "auto";
    
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' });
    if (gl) {
      video.style.transform = 'translateZ(0)';
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-xl mb-4" 
         style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        src={videoSrc}
        onTimeUpdate={onTimeUpdate}
        onError={() => onError('Error loading video')}
      />
    </div>
  );
};

export default VideoPlayer;