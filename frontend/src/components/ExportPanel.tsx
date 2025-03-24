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
  }, [defaultTitle]);

  const calculateEstimatedSize = () => {
    const clipDuration = trimEnd - trimStart;
    let baseMultiplier = exportSettings.fileExtension === "mp4" ? 1.5 : exportSettings.fileExtension === "mov" ? 1.8 : 3.0;
    if (exportSettings.resolution === "1080p") baseMultiplier *= 1.0;
    else if (exportSettings.resolution === "720p") baseMultiplier *= 0.6;
    else if (exportSettings.resolution === "480p") baseMultiplier *= 0.3;
    const bitrateFactor = exportSettings.bitrate ? parseInt(exportSettings.bitrate) / 8000 : 1;
    const estimatedSize = clipDuration * baseMultiplier * (bitrateFactor || 1);
    return estimatedSize.toFixed(2);
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