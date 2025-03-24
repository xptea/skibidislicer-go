import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AudioVisualizerProps {
  videoSrc: string;
  progress: number;
  canvasWidth: number;
  canvasHeight: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ videoSrc, progress, canvasWidth, canvasHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const frameRequestRef = useRef(0);
  const lastDrawnProgressRef = useRef(0);
  const lastWidthRef = useRef(0);
  const lastHeightRef = useRef(0);

  const servedVideoUrl = useMemo(() => {
    const encodedPath = encodeURIComponent(videoSrc);
    return `http://localhost:34115/video/${encodedPath}`;
  }, [videoSrc]);

  useEffect(() => {
    const fetchAudioData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(servedVideoUrl);
        if (!response.ok) throw new Error('Failed to fetch video');
        
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const numberOfSamples = 200;
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(channelData.length / numberOfSamples);
        
        const processedData = [];
        for (let i = 0; i < numberOfSamples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[blockStart + j]);
          }
          processedData.push(sum / blockSize);
        }
        
        const multiplier = 1.0 / Math.max(...processedData, 0.01);
        const normalizedData = processedData.map(n => n * multiplier);
        
        setAudioData(normalizedData);
        drawWaveform(normalizedData, progress);
        
        lastWidthRef.current = canvasWidth;
        lastHeightRef.current = canvasHeight;
      } catch (error) {
        console.error('Error processing audio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAudioData();
    
    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = 0;
      }
    };
  }, [servedVideoUrl]);

  useEffect(() => {
    if (audioData.length > 0) {
      drawWaveform(audioData, progress);
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const shouldRedraw = 
      Math.abs(lastDrawnProgressRef.current - progress) > 0.5 || 
      progress === 0 ||
      lastWidthRef.current !== canvasWidth ||
      lastHeightRef.current !== canvasHeight;
      
    if (shouldRedraw) {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      
      if (audioData.length > 0) {
        frameRequestRef.current = requestAnimationFrame(() => {
          drawWaveform(audioData, progress);
          lastDrawnProgressRef.current = progress;
          lastWidthRef.current = canvasWidth;
          lastHeightRef.current = canvasHeight;
        });
      }
    }
  }, [progress, audioData, canvasWidth, canvasHeight]);

  const drawWaveform = (data: number[], currentProgress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / data.length;
    
    ctx.fillStyle = 'rgb(39, 39, 42)';
    ctx.fillRect(0, 0, width, height);
    
    const playedWidth = (currentProgress / 100) * width;
    
    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const barHeight = data[i] * height * 0.7;
      const y = (height - barHeight) / 2;
      
      ctx.fillStyle = x <= playedWidth ? '#10B981' : '#888888';
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  };

  return (
    <div className="relative h-16">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading waveform...</div>
        </div>
      ) : (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

export default AudioVisualizer;
