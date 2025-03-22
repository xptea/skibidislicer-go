import React from 'react';

interface SettingsProps {
  setCurrentPage: (page: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-900 bg-black py-4 px-6 shadow-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="text-3xl font-bold">
            <span className="text-zinc-100">Skibidi<span className="text-emerald-500">Slicer</span></span>
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
              {/* Video Output Settings */}
              <div className="p-4 border border-zinc-800 rounded-md bg-black">
                <h2 className="text-lg font-medium mb-4 text-emerald-500">Video Output</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-300 mb-1">Format</label>
                    <select className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="webm">WebM</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-zinc-300 mb-1">Quality</label>
                    <div className="flex items-center">
                      <input type="range" className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                      <span className="ml-2 text-zinc-400">High</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="form-checkbox text-emerald-500 rounded bg-zinc-700 border-none focus:ring-emerald-500" />
                      <span className="text-zinc-300">Maintain original resolution</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Default Save Location */}
              <div className="p-4 border border-zinc-800 rounded-md bg-black">
                <h2 className="text-lg font-medium mb-4 text-emerald-500">Save Location</h2>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="C:/Videos/Exports" 
                  />
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 px-4 rounded-md transition-colors">
                    Browse
                  </button>
                </div>
              </div>
              
              {/* App Settings */}
              <div className="p-4 border border-zinc-800 rounded-md bg-black">
                <h2 className="text-lg font-medium mb-4 text-emerald-500">Application Settings</h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="form-checkbox text-emerald-500 rounded bg-zinc-700 border-none focus:ring-emerald-500" checked />
                      <span className="text-zinc-300">Start in dark mode</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="form-checkbox text-emerald-500 rounded bg-zinc-700 border-none focus:ring-emerald-500" />
                      <span className="text-zinc-300">Auto-save projects</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="form-checkbox text-emerald-500 rounded bg-zinc-700 border-none focus:ring-emerald-500" />
                      <span className="text-zinc-300">Check for updates on startup</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-md transition-colors">
                Reset to Default
              </button>
              <button className="bg-emerald-700 hover:bg-emerald-600 text-white py-2 px-4 rounded-md transition-colors">
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