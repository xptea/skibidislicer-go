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

  const saveSettings = async () => {
    if (currentDir) {
      try {
        await SaveWatchLocation(currentDir)
        await SaveSaveLocation(saveDir)
        await SaveExportSettings({
          file_extension: fileExtension,
          resolution,
          codec,
          bitrate,
          copy_to_clipboard: copyToClipboard,
          watch_location: currentDir,
          save_location: saveDir
        })
        if (onSettingsSaved) {
          onSettingsSaved()
        }
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    }
  }

  const handleDirectoryChange = async (dir: string, type: 'watch' | 'save'): Promise<void> => {
    if (type === 'watch') {
      setCurrentDir(dir)
      if (dir) await SaveWatchLocation(dir)
    } else {
      setSaveDir(dir)
      if (dir) await SaveSaveLocation(dir)
    }
    if (onSettingsSaved) onSettingsSaved()
  }

  const handleSettingChange = async <T extends string | boolean>(
    value: T,
    setter: React.Dispatch<React.SetStateAction<T>>,
    key: string
  ) => {
    setter(value)
    if (currentDir) {
      await SaveExportSettings({
        file_extension: fileExtension,
        resolution,
        codec,
        bitrate,
        copy_to_clipboard: copyToClipboard,
        watch_location: currentDir,
        save_location: saveDir,
        [key]: value
      })
      if (onSettingsSaved) onSettingsSaved()
    }
  }

  return (
    <div className="flex-1 flex items-start justify-center p-4 bg-black">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-6 text-white">Workspace Configuration</h2>
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Watch Directory</label>
              <div className="flex gap-3">
                <input
                  value={currentDir}
                  onChange={(e) => { handleDirectoryChange(e.target.value, 'watch') }}
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white"
                />
                <button className="px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white"
                        onClick={() => FetchDirectory().then(dir => { if (dir) handleDirectoryChange(dir, 'watch') })}>
                  Browse
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Export Directory</label>
              <div className="flex gap-3">
                <input
                  value={saveDir}
                  onChange={(e) => { handleDirectoryChange(e.target.value, 'save') }}
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white"
                />
                <button className="px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white"
                        onClick={() => FetchDirectory().then(dir => { if (dir) handleDirectoryChange(dir, 'save') })}>
                  Browse
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-6 text-white">Export Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">File Format</label>
              <select
                value={fileExtension}
                onChange={(e) => handleSettingChange(e.target.value, setFileExtension, 'file_extension')}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white">
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="gif">GIF</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => handleSettingChange(e.target.value, setResolution, 'resolution')}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white">
                <option value="source">Source</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Codec</label>
              <select
                value={codec}
                onChange={(e) => handleSettingChange(e.target.value, setCodec, 'codec')}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white">
                <option value="default">Default</option>
                <option value="h264_nvenc">H.264 NVENC</option>
                <option value="hevc_nvenc">HEVC NVENC</option>
                <option value="libx264">libx264</option>
                <option value="libx265">libx265</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Bitrate (kbps)</label>
              <input
                type="number"
                value={bitrate}
                onChange={(e) => handleSettingChange(e.target.value, setBitrate, 'bitrate')}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white"
                placeholder="Auto"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={copyToClipboard}
                  onChange={(e) => handleSettingChange(e.target.checked, setCopyToClipboard, 'copy_to_clipboard')}
                  className="rounded border-zinc-600"
                />
                Copy to clipboard after export
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings