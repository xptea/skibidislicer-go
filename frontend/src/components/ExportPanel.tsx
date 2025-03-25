import React, { useState, useEffect } from 'react'
import { ExportClip, GetExportSettings } from '../../wailsjs/wailsjs/go/main/App'

interface ExportPanelProps {
  currentTime: number
  duration: number
  trimStart: number
  trimEnd: number
  formatTime: (time: number) => string
  defaultTitle: string
  videoPath: string
  isMuted: boolean
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  duration,
  trimStart,
  trimEnd,
  formatTime,
  defaultTitle,
  videoPath,
  isMuted
}) => {
  const [clipTitle, setClipTitle] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [sourceFileSize, setSourceFileSize] = useState(0)
  const [exportSettings, setExportSettings] = useState({
    fileExtension: "mp4",
    resolution: "source",
    codec: "default",
    bitrate: "",
    copyToClipboard: false
  })

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await GetExportSettings()
      if (settings) setExportSettings({
        fileExtension: settings.file_extension || "mp4",
        resolution: settings.resolution || "source",
        codec: settings.codec || "default",
        bitrate: settings.bitrate || "",
        copyToClipboard: settings.copy_to_clipboard || false
      })
    }
    loadSettings()
    setClipTitle(defaultTitle)
    fetch(`http://localhost:34115/video/${encodeURIComponent(videoPath)}`, { method: 'HEAD' })
          .then(response => setSourceFileSize(parseInt(response.headers.get('content-length') || '0')))
          .catch(console.error)
  }, [defaultTitle, videoPath])

  const calculateEstimatedSize = () => {
    const clipDuration = trimEnd - trimStart
    if (sourceFileSize === 0 || duration === 0) return '0.00'
    let estimatedSize = (sourceFileSize / duration) * clipDuration
    const multipliers = {
      codec: { 'h264_nvenc': 1.1, 'hevc_nvenc': 0.85, 'libx264': 1.0, 'libx265': 0.8, 'default': 1.0 },
      resolution: { 'source': 1.0, '1080p': 0.95, '720p': 0.5, '480p': 0.25 },
      format: { 'mp4': 1.0, 'mov': 1.1, 'gif': 1.2 }
    }
    estimatedSize *= multipliers.codec[exportSettings.codec as keyof typeof multipliers.codec] || 1.0
    estimatedSize *= multipliers.resolution[exportSettings.resolution as keyof typeof multipliers.resolution] || 1.0
    estimatedSize *= multipliers.format[exportSettings.fileExtension as keyof typeof multipliers.format] || 1.0
    if (exportSettings.bitrate) estimatedSize = (parseInt(exportSettings.bitrate) * 125 * clipDuration)
    if (isMuted) estimatedSize *= 0.85
    return (estimatedSize / (1024 * 1024)).toFixed(2)
  }

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const codec = isMuted ? `${exportSettings.codec}:muted` : exportSettings.codec
      await ExportClip(videoPath, clipTitle, trimStart, trimEnd, exportSettings.fileExtension, 
                      exportSettings.resolution, codec, exportSettings.bitrate)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 5000)
    } catch (error) {
      setExportError(error as string)
      setTimeout(() => setExportError(null), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={clipTitle}
        onChange={(e) => setClipTitle(e.target.value)}
        placeholder="Clip title"
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-center text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />

      <button 
        className={`w-full py-2.5 rounded-lg transition-colors ${
          isExporting ? 'bg-zinc-700 cursor-not-allowed' :
          exportSuccess ? 'bg-emerald-600/50 border border-emerald-500/30' :
          'bg-emerald-600 hover:bg-emerald-500'
        }`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export Clip'}
      </button>
      
      {exportError && (
        <div className="text-red-400 text-sm text-center">
          Export failed: {exportError}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-zinc-400">
        <span>Estimated Size: {calculateEstimatedSize()} MB</span>
        <span>Duration: {formatTime(trimEnd - trimStart)}</span>
      </div>
    </div>
  )
}

export default ExportPanel