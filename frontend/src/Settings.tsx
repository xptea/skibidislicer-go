import React, { useState, useEffect } from 'react'
import {FetchDirectory, SaveWatchLocation, GetWatchLocation, SaveSaveLocation, GetSaveLocation} from '../wailsjs/go/main/App'

interface SettingsProps {
  setCurrentPage: (page: string) => void
}

const Settings: React.FC<SettingsProps> = ({ setCurrentPage }) => {
  const [currentDir, setCurrentDir] = useState("")
  const [saveDir, setSaveDir] = useState("")

  useEffect(() => {
    const loadLocations = async () => {
      const watchLocation = await GetWatchLocation()
      if (watchLocation) {
        setCurrentDir(watchLocation)
      }
      
      const saveLocation = await GetSaveLocation()
      if (saveLocation) {
        setSaveDir(saveLocation)
      }
    }
    loadLocations()
  }, [])

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
    await SaveWatchLocation(currentDir)
    await SaveSaveLocation(saveDir)
    setCurrentPage('home')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-900 bg-black py-4 px-6 shadow-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="text-3xl font-bold">
            <span className="text-zinc-100">SkibidiSlicer</span>
          </div>
          <nav className="flex gap-6">
            <button className="hover:text-emerald-400 transition-colors" onClick={() => setCurrentPage('home')}>Home</button>
            <button className="text-emerald-400" onClick={() => setCurrentPage('settings')}>Settings</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-3xl w-full mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-6">
            <h1 className="text-2xl font-bold mb-6 text-center text-zinc-100">Settings</h1>
            
            <div className="space-y-6">
              {/* Watch Location */}
              <div className="p-4 border border-zinc-800 rounded-md bg-black">
                <h2 className="text-lg font-medium mb-4 text-emerald-500">Watch Location</h2>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={currentDir}
                    onChange={(e) => setCurrentDir(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 px-4 rounded-md transition-colors" onClick={handleOpenWatchDir}>
                    Browse
                  </button>
                </div>
              </div>
              
              {/* Save Location */}
              <div className="p-4 border border-zinc-800 rounded-md bg-black">
                <h2 className="text-lg font-medium mb-4 text-emerald-500">Save Location</h2>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={saveDir}
                    onChange={(e) => setSaveDir(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 px-4 rounded-md transition-colors" onClick={handleOpenSaveDir}>
                    Browse
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button className="bg-emerald-700 hover:bg-emerald-600 text-white py-2 px-4 rounded-md transition-colors" onClick={handleSave}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-4 px-6 text-center text-zinc-600 text-sm mt-auto bg-black">
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