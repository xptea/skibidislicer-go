import React, { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';

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
  formatTime
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const servedVideoUrl = useMemo(() => {
    const encodedPath = encodeURIComponent(videoSrc);
    return `http://localhost:34115/video/${encodedPath}`;
  }, [videoSrc]);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      const video = document.createElement('video');
      video.src = servedVideoUrl;
      videoRef.current = video;

      video.addEventListener('loadeddata', () => {
        if (waveformRef.current) {
          const wavesurfer = WaveSurfer.create({
            backend: 'MediaElement',
            container: waveformRef.current,
            waveColor: '#888888',
            progressColor: '#ffffff',
            cursorColor: 'transparent',
            barWidth: 3,
            barGap: 2,
            barRadius: 2,
            height: 60,
            normalize: true,
            fillParent: true,
            minPxPerSec: 1,
            interact: false,
            barHeight: 3,
            media: video
          });

          wavesurfer.on('ready', () => {
            setIsWaveformReady(true);
          });

          wavesurfer.on('error', (err) => {
            console.error('Waveform error:', err);
          });

          wavesurferRef.current = wavesurfer;
        }
      });

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
        if (videoRef.current) {
          videoRef.current.src = '';
        }
      };
    }
  }, [servedVideoUrl]);

  useEffect(() => {
    if (wavesurferRef.current && isWaveformReady) {
      wavesurferRef.current.seekTo(progress / 100);
    }
  }, [progress, isWaveformReady]);

  const trimStartPercent = (trimStart / duration) * 100;
  const trimEndPercent = (trimEnd / duration) * 100;

  return (
    <div className="relative">
      <div
        className="relative h-16 cursor-pointer select-none"
        onMouseDown={handleScrub}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleScrub(e);
          handleTrimHandleMouseMove(e);
        }}
        onMouseUp={handleTrimHandleMouseUp}
        onMouseLeave={handleTrimHandleMouseUp}
      >
        <div className="absolute inset-0 bg-zinc-900 rounded-lg overflow-hidden">
          <div ref={waveformRef} className="absolute inset-0 opacity-90" />
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/70 pointer-events-none z-10 transition-all duration-75"
            style={{ width: `${trimStartPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/70 pointer-events-none z-10 transition-all duration-75"
            style={{ width: `${100 - trimEndPercent}%` }}
          />
          <div
            className="absolute bg-white pointer-events-none z-20 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
            style={{ 
              left: `${progress}%`, 
              width: '2px',
              height: '180%',
              top: '-40%'
            }}
          />

        </div>
        <div
          className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center"
          style={{ left: `${trimStartPercent}%` }}
          onMouseDown={() => handleTrimHandleMouseDown('start')}
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
          onMouseDown={() => handleTrimHandleMouseDown('end')}
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