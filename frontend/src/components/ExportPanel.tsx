import React, { useState, useEffect } from 'react';
import { ExportClip, GetExportSettings } from '../../wailsjs/wailsjs/go/main/App';

interface ExportPanelProps {
  currentTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  formatTime: (time: number) => string;
  defaultTitle: string;
  videoPath: string;
  isMuted: boolean;
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
  const [clipTitle, setClipTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sourceFileSize, setSourceFileSize] = useState<number>(0);
  const [exportSettings, setExportSettings] = useState({
    fileExtension: "mp4",
    resolution: "source",
    codec: "default",
    bitrate: "",
    copyToClipboard: false
  });

  useEffect(() => {
    const loadExportSettings = async () => {
      const settings = await GetExportSettings()
      if (settings) {
        setExportSettings({
          fileExtension: settings.file_extension || "mp4",
          resolution: settings.resolution || "source",
          codec: settings.codec || "default",
          bitrate: settings.bitrate || "",
          copyToClipboard: settings.copy_to_clipboard || false
        });
      }
    };
    loadExportSettings();
    setClipTitle(defaultTitle);

    fetch(`http://localhost:34115/video/${encodeURIComponent(videoPath)}`, { method: 'HEAD' })
      .then(response => {
        const size = parseInt(response.headers.get('content-length') || '0');
        setSourceFileSize(size);
      })
      .catch(error => console.error('Error getting file size:', error));
  }, [defaultTitle, videoPath]);

  const calculateEstimatedSize = () => {
    const clipDuration = trimEnd - trimStart;
    const sourceDuration = duration;
    
    if (sourceFileSize === 0 || sourceDuration === 0) return '0.00';
    
    let estimatedSize = (sourceFileSize / sourceDuration) * clipDuration;
    
    const codecMultipliers: { [key: string]: number } = {
      'h264_nvenc': 1.1,
      'hevc_nvenc': 0.85,
      'libx264': 1.0,
      'libx265': 0.8,
      'default': 1.0
    };
    
    const resolutionMultipliers: { [key: string]: number } = {
      'source': 1.0,
      '1080p': 0.95,
      '720p': 0.5,
      '480p': 0.25
    };
    
    const formatMultipliers: { [key: string]: number } = {
      'mp4': 1.0,
      'mov': 1.1,
      'gif': 1.2
    };
    
    estimatedSize *= codecMultipliers[exportSettings.codec] || 1.0;
    
    estimatedSize *= resolutionMultipliers[exportSettings.resolution] || 1.0;
    
    estimatedSize *= formatMultipliers[exportSettings.fileExtension] || 1.0;
    
    if (exportSettings.bitrate) {
      const bitrateInBytes = parseInt(exportSettings.bitrate) * 125;
      estimatedSize = (bitrateInBytes * clipDuration);
    }
    
    if (isMuted) {
      estimatedSize *= 0.85;
    }
    
    return (estimatedSize / (1024 * 1024)).toFixed(2);
  };

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    
    try {
      const codec = isMuted ? `${exportSettings.codec}:muted` : exportSettings.codec;
      
      const outputPath = await ExportClip(
        videoPath,
        clipTitle,
        trimStart,
        trimEnd,
        exportSettings.fileExtension,
        exportSettings.resolution,
        codec,
        exportSettings.bitrate
      );
      setExportSuccess(true);
      if (exportSettings.copyToClipboard) {
        console.log(`Copying to clipboard: ${outputPath}`);
      }
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (error) {
      setExportError(error as string);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={clipTitle}
        onChange={(e) => setClipTitle(e.target.value)}
        placeholder="Enter clip title..."
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
      />

      <button 
        className={`w-full py-2 px-4 rounded-md transition-colors ${
          isExporting 
            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
            : exportSuccess 
              ? 'bg-green-700 hover:bg-green-600 text-white' 
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
        }`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : exportSuccess ? 'Exported Successfully!' : 'Export Clip'}
      </button>
      
      {exportError && (
        <div className="text-red-500 text-sm text-center p-1">
          Export failed: {exportError}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-zinc-500">
        <span>Estimated Clip Size: {calculateEstimatedSize()} MB</span>
        <span>Clip duration: {formatTime(trimEnd - trimStart)}</span>
      </div>
    </div>
  );
};

export default ExportPanel;