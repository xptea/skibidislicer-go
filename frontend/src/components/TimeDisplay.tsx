import React from 'react';

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  formatTime: (time: number) => string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  duration,
  formatTime
}) => {
  return (
    <div className="flex justify-between text-sm text-zinc-400 mb-1">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  );
};

export default TimeDisplay;