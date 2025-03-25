import React, { useState, useEffect } from 'react'
import { FetchDirectory, SaveWatchLocation, GetWatchLocation, SaveSaveLocation, GetSaveLocation, SaveExportSettings, GetExportSettings } from '../wailsjs/wailsjs/go/main/App'

interface SettingsProps {
  setCurrentPage: (page: string) => void
  onSettingsSaved?: () => void
}

const Settings: React.FC<SettingsProps> = ({ setCurrentPage, onSettingsSaved }) => {
  const [currentDir, setCurrentDir] = useState("")
  const [saveDir, setSaveDir] = useState("")
  const [fileExtension, setFileExtension] = useState("mp4")
  const [resolution, setResolution] = useState("source")
  const [codec, setCodec] = useState("default")
  const [bitrate, setBitrate] = useState("")
  const [copyToClipboard, setCopyToClipboard] = useState(false)
  
  useEffect(() => {
    const loadSettings = async () => {
      const watchLocation = await GetWatchLocation()
      const saveLocation = await GetSaveLocation()
      const exportSettings = await GetExportSettings()
      if (watchLocation) setCurrentDir(watchLocation)
      if (saveLocation) setSaveDir(saveLocation)
      if (exportSettings) {
        setFileExtension(exportSettings.file_extension || "mp4")
        setResolution(exportSettings.resolution || "source")
        setCodec(exportSettings.codec || "default")
        setBitrate(exportSettings.bitrate || "")
        setCopyToClipboard(exportSettings.copy_to_clipboard || false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    await SaveWatchLocation(currentDir)
    await SaveSaveLocation(saveDir)
    await SaveExportSettings({
      file_extension: fileExtension,
      resolution: resolution,
      codec: codec,
      bitrate: bitrate,
      copy_to_clipboard: copyToClipboard,
    })
    if (onSettingsSaved) onSettingsSaved()
    setCurrentPage('home')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-black/95 backdrop-blur-sm py-4 px-6 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="bg-white bg-clip-text text-transparent">
              Skibidi Slicer
            </span>
          </h1>
          <nav className="flex gap-4">
            <button className="px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm font-medium" 
                    onClick={() => setCurrentPage('home')}>
              Home
            </button>
            <button className="px-4 py-2 rounded-lg bg-zinc-900 text-emerald-400 text-sm font-medium">
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 bg-gradient-to-b from-black to-zinc-900/50">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-6 text-zinc-100">Workspace Configuration</h2>
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Watch Directory</label>
                <div className="flex gap-3">
                  <input
                    value={currentDir}
                    onChange={(e) => setCurrentDir(e.target.value)}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm"
                  />
                  <button className="px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                          onClick={() => FetchDirectory().then(dir => dir && setCurrentDir(dir))}>
                    Browse
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Export Directory</label>
                <div className="flex gap-3">
                  <input
                    value={saveDir}
                    onChange={(e) => setSaveDir(e.target.value)}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm"
                  />
                  <button className="px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                          onClick={() => FetchDirectory().then(dir => dir && setSaveDir(dir))}>
                    Browse
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-6 text-zinc-100">Export Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">File Format</label>
                <select
                  value={fileExtension}
                  onChange={(e) => setFileExtension(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm">
                  <option value="mp4">MP4</option>
                  <option value="mov">MOV</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm">
                  <option value="source">Source</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Codec</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm">
                  <option value="default">Default</option>
                  <option value="h264_nvenc">H.264 NVENC</option>
                  <option value="hevc_nvenc">HEVC NVENC</option>
                  <option value="libx264">libx264</option>
                  <option value="libx265">libx265</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Bitrate (kbps)</label>
                <input
                  type="number"
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm"
                  placeholder="Auto"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={copyToClipboard}
                    onChange={(e) => setCopyToClipboard(e.target.checked)}
                    className="rounded border-zinc-600"
                  />
                  Copy to clipboard after export
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings