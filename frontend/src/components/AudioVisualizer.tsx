import React, { useEffect, useMemo, useRef, useState } from 'react'

interface AudioVisualizerProps {
  videoSrc: string
  progress: number
  canvasWidth: number
  canvasHeight: number
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ videoSrc, progress, canvasWidth, canvasHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [audioData, setAudioData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const servedVideoUrl = useMemo(() => 
    `http://localhost:34115/video/${encodeURIComponent(videoSrc)}`, [videoSrc])

  useEffect(() => {
    const fetchAudioData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(servedVideoUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const channelData = audioBuffer.getChannelData(0)
        const blockSize = Math.floor(channelData.length / 200)
        const processedData = []
        for (let i = 0; i < 200; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) sum += Math.abs(channelData[i * blockSize + j])
          processedData.push(sum / blockSize)
        }
        const multiplier = 1.0 / Math.max(...processedData, 0.01)
        setAudioData(processedData.map(n => n * multiplier))
      } catch (error) {
        console.error('Error processing audio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAudioData()
  }, [servedVideoUrl])

  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = canvasWidth
      canvas.height = canvasHeight
      ctx.fillStyle = 'rgb(39 39 42)'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      const playedWidth = (progress / 100) * canvasWidth
      const barWidth = canvasWidth / audioData.length

      for (let i = 0; i < audioData.length; i++) {
        const x = i * barWidth
        const barHeight = audioData[i] * canvasHeight * 0.7
        const y = (canvasHeight - barHeight) / 2
        ctx.fillStyle = x <= playedWidth ? '#10b981' : '#52525b'
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      }
    }

    if (audioData.length > 0) drawWaveform()
  }, [audioData, progress, canvasWidth, canvasHeight])

  return (
    <div className="relative h-16">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
          <div className="animate-pulse text-zinc-500 text-sm">Analyzing audio...</div>
        </div>
      ) : (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  )
}

export default AudioVisualizer