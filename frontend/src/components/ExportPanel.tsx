import React from 'react';

interface ExportPanelProps {
  currentTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  formatTime: (time: number) => string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  currentTime,
  duration,
  trimStart,
  trimEnd,
  formatTime
}) => {
  const estimatedFileSize = ((trimEnd - trimStart) / duration * 1.51).toFixed(2);

  return (
    <>
      <div className="flex justify-between items-center text-xs text-zinc-500 mt-4">
        <span>File Size: 1.51 MB | Estimated Clip Size: {estimatedFileSize} MB</span>
        <span>Clip duration: {formatTime(trimEnd - trimStart)}</span>
      </div>

      <div className="flex justify-center mt-6">
        <button className="bg-emerald-700 hover:bg-emerald-600 text-white py-2 px-4 rounded-md  transition-colors">
          Export Clip
        </button>
      </div>
    </>
  );
};

export default ExportPanel;