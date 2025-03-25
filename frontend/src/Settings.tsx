import React, { useState, useEffect } from 'react'
import {FetchDirectory, SaveWatchLocation, GetWatchLocation, SaveSaveLocation, GetSaveLocation, SaveExportSettings, GetExportSettings} from '../wailsjs/wailsjs/go/main/App'

interface SettingsProps {
  setCurrentPage: (page: string) => void
  onSettingsSaved?: () => void
}

const CURRENT_VERSION = "v1.0.1"
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/xptea/skibidislicer-go/refs/heads/main/frontend/src/version.txt"

const Settings: React.FC<SettingsProps> = ({ setCurrentPage, onSettingsSaved }) => {
  const [currentDir, setCurrentDir] = useState("")
  const [saveDir, setSaveDir] = useState("")
  const [fileExtension, setFileExtension] = useState("mp4")
  const [resolution, setResolution] = useState("source")
  const [codec, setCodec] = useState("default")
  const [bitrate, setBitrate] = useState("")
  const [copyToClipboard, setCopyToClipboard] = useState(false)
  const [showCodecInfo, setShowCodecInfo] = useState(false)
  const [showBitrateInfo, setShowBitrateInfo] = useState(false)
  const [latestVersion, setLatestVersion] = useState("")
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateError, setUpdateError] = useState("")

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const watchLocation = await GetWatchLocation()
        if (watchLocation) {
          setCurrentDir(watchLocation)
        }
        
        const saveLocation = await GetSaveLocation()
        if (saveLocation) {
          setSaveDir(saveLocation)
        }

        const exportSettings = await GetExportSettings()
        if (exportSettings) {
          setFileExtension(exportSettings.file_extension || "mp4")
          setResolution(exportSettings.resolution || "source")
          setCodec(exportSettings.codec || "default")
          setBitrate(exportSettings.bitrate || "")
          setCopyToClipboard(exportSettings.copy_to_clipboard || false)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    
    loadSettings()
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    setCheckingUpdate(true)
    setUpdateError("")
    
    try {
      const response = await fetch(VERSION_CHECK_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.status}`)
      }
      
      const versionText = await response.text()
      const cleanVersion = versionText.trim()
      setLatestVersion(cleanVersion)
      
      if (cleanVersion !== CURRENT_VERSION && cleanVersion !== "") {
        setUpdateAvailable(true)
        localStorage.setItem('updateAvailable', 'true')
        localStorage.setItem('latestVersion', cleanVersion)
      } else {
        localStorage.removeItem('updateAvailable')
      }
    } catch (error) {
      setUpdateError("Failed to check for updates")
      console.error("Update check failed:", error)
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleOpenWatchDir = async () => {
    const dir = await FetchDirectory()
    if (dir) {
      setCurrentDir(dir)
    }
  }
  
  const handleOpenSaveDir = async () => {
    const dir = await FetchDirectory()
    if (dir) {
      setSaveDir(dir)
    }
  }

  const handleSave = async () => {
    try {
      await SaveWatchLocation(currentDir)
      await SaveSaveLocation(saveDir)
      
      await SaveExportSettings({
        file_extension: fileExtension,
        resolution: resolution,
        codec: codec,
        bitrate: bitrate,
        copy_to_clipboard: copyToClipboard,
        watch_location: currentDir,
        save_location: saveDir
      })
      
      if (onSettingsSaved) await onSettingsSaved()
      setCurrentPage('home')
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  const handleUpdate = () => {
    window.open('https://github.com/xptea/skibidislicer-go/releases/latest/download/skibidislicer-go-amd64-installer.exe', '_blank')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-900 bg-black py-3 px-6 shadow-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="text-2xl font-bold">
            <span className="text-zinc-100">SkibidiSlicer</span>
          </div>
          <nav className="flex gap-4">
            <button className="hover:text-emerald-400 transition-colors" onClick={() => setCurrentPage('home')}>Home</button>
            <button className="text-emerald-400" onClick={() => setCurrentPage('settings')}>Settings</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-4">
            <h1 className="text-xl font-bold mb-4 text-center text-zinc-100">Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-3 border border-zinc-800 rounded-md bg-black col-span-1 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h2 className="text-sm font-medium mb-2 text-emerald-500">Watch Location</h2>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={currentDir}
                        onChange={(e) => setCurrentDir(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" 
                      />
                      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-1.5 px-2.5 rounded-md transition-colors text-sm" onClick={handleOpenWatchDir}>
                        Browse
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium mb-2 text-emerald-500">Save Location</h2>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={saveDir}
                        onChange={(e) => setSaveDir(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" 
                      />
                      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-1.5 px-2.5 rounded-md transition-colors text-sm" onClick={handleOpenSaveDir}>
                        Browse
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-zinc-800 rounded-md bg-black col-span-1 lg:col-span-2">
                <h2 className="text-sm font-medium mb-3 text-emerald-500">Export Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">File Extension</label>
                    <select
                      value={fileExtension}
                      onChange={(e) => setFileExtension(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    >
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="gif">GIF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    >
                      <option value="source">Same as source</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center text-zinc-400 text-xs mb-1">
                      <span>Codec</span>
                      <button 
                        onClick={() => setShowCodecInfo(!showCodecInfo)}
                        className="ml-1 text-emerald-500 text-xs hover:text-emerald-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                      </button>
                    </label>
                    <select
                      value={codec}
                      onChange={(e) => setCodec(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    >
                      <option value="default">Default</option>
                      <option value="h264_nvenc">H.264 (NVIDIA NVENC)</option>
                      <option value="hevc_nvenc">H.265/HEVC (NVIDIA NVENC)</option>
                      <option value="libx264">H.264 (libx264)</option>
                      <option value="libx265">H.265/HEVC (libx265)</option>
                    </select>
                    {showCodecInfo && (
                      <div className="mt-2 p-2 bg-zinc-800 rounded-md text-xs text-zinc-300 border border-zinc-700">
                        <p className="mb-1"><span className="text-emerald-400">Default</span>: Uses the format's standard codec</p>
                        <p className="mb-1"><span className="text-emerald-400">H.264 (NVIDIA NVENC)</span>: Hardware-accelerated encoding for NVIDIA GPUs. Fast with good quality.</p>
                        <p className="mb-1"><span className="text-emerald-400">H.265/HEVC (NVIDIA NVENC)</span>: Better compression than H.264 with NVIDIA acceleration.</p>
                        <p className="mb-1"><span className="text-emerald-400">H.264 (libx264)</span>: Software encoding, high compatibility, good balance of quality and size.</p>
                        <p><span className="text-emerald-400">H.265/HEVC (libx265)</span>: Better compression but slower encoding. Smaller files at same quality.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center text-zinc-400 text-xs mb-1">
                      <span>Bitrate (kbps)</span>
                      <button 
                        onClick={() => setShowBitrateInfo(!showBitrateInfo)}
                        className="ml-1 text-emerald-500 text-xs hover:text-emerald-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                      </button>
                    </label>
                    <input
                      type="number"
                      value={bitrate}
                      onChange={(e) => setBitrate(e.target.value)}
                      placeholder="Default"
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    />
                    {showBitrateInfo && (
                      <div className="mt-2 p-2 bg-zinc-800 rounded-md text-xs text-zinc-300 border border-zinc-700">
                        <p className="mb-1">Bitrate controls the quality and file size of your video:</p>
                        <p className="mb-1"><span className="text-emerald-400">Higher bitrate</span>: Better quality, larger file size</p>
                        <p className="mb-1"><span className="text-emerald-400">Lower bitrate</span>: Smaller file size, reduced quality</p>
                        <p className="mb-1">Recommended values:</p>
                        <ul className="list-disc pl-4">
                          <li>SD (480p): 1,000-2,000 kbps</li>
                          <li>HD (720p): 2,500-4,000 kbps</li>
                          <li>Full HD (1080p): 4,000-8,000 kbps</li>
                        </ul>
                        <p className="mt-1">Leave empty for automatic selection.</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={copyToClipboard}
                        onChange={(e) => setCopyToClipboard(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-zinc-400 text-sm">Copy to clipboard after export</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-zinc-800 rounded-md bg-black col-span-1 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-emerald-500">Application Updates</h2>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-zinc-400">
                      Current: <span className="text-zinc-200">{CURRENT_VERSION}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Latest: <span className={`${updateAvailable ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {checkingUpdate ? "Checking..." : latestVersion || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  {updateError ? (
                    <span className="text-red-400 text-xs">{updateError}</span>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      {updateAvailable 
                        ? "A new version is available." 
                        : "You are using the latest version."}
                    </span>
                  )}
                  
                  <div className="flex space-x-2">
                    <button 
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-md text-sm transition-colors"
                      onClick={checkForUpdates}
                      disabled={checkingUpdate}
                    >
                      {checkingUpdate ? "Checking..." : "Check for Updates"}
                    </button>
                    
                    {updateAvailable && (
                      <button 
                        className="bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-3 rounded-md text-sm transition-colors"
                        onClick={handleUpdate}
                      >
                        Download Update
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-1 lg:col-span-2">
                <div className="flex justify-end items-center">
                  <button className="bg-emerald-700 hover:bg-emerald-600 text-white py-1.5 px-3 rounded-md transition-colors text-sm" onClick={handleSave}>
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-2 px-6 text-center text-zinc-600 text-xs mt-auto bg-black">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            SkibidiSlicer © {new Date().getFullYear()}
          </div>
          <div className="text-zinc-500">
            VoidWorks company
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Settings;