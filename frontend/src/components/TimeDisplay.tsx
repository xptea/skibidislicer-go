import React from 'react'

interface TimeDisplayProps {
  currentTime: number
  duration: number
  formatTime: (time: number) => string
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  duration,
  formatTime
}) => {
  return (
    <div className="flex justify-between text-sm font-medium text-zinc-400">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  )
}

export default TimeDisplay