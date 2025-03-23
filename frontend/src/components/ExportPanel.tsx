import React, { useState, useEffect } from 'react';
import { ExportClip } from '../../wailsjs/go/main/App';

interface ExportPanelProps {
  currentTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  formatTime: (time: number) => string;
  defaultTitle: string;
  videoPath: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  currentTime,
  duration,
  trimStart,
  trimEnd,
  formatTime,
  defaultTitle,
  videoPath
}) => {
  const [clipTitle, setClipTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const estimatedFileSize = ((trimEnd - trimStart) / duration * 1.5).toFixed(2);

  useEffect(() => {
    setClipTitle(defaultTitle);
  }, [defaultTitle]);
  
  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    
    try {
      const outputPath = await ExportClip(videoPath, clipTitle, trimStart, trimEnd);
      setExportSuccess(true);
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
        <span>Estimated Clip Size: {estimatedFileSize} MB</span>
        <span>Clip duration: {formatTime(trimEnd - trimStart)}</span>
      </div>
    </div>
  );
};

export default ExportPanel;