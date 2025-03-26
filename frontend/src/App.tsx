import { useState, useEffect, DragEvent, useRef, useCallback } from 'react'
import VideoEditor from './VideoEditor'
import Settings from './Settings'
import WindowHeader from './components/WindowHeader'
import { GetLatestVideos, GetWatchLocation, SelectVideo, HandleFileUpload, SaveWatchLocation } from '../wailsjs/wailsjs/go/main/App'
import { EventsOn, EventsOff, WindowSetSize, WindowIsMaximised } from '../wailsjs/wailsjs/runtime/runtime'
import { main } from '../wailsjs/wailsjs/go/models'

interface VideoWithThumbnail extends main.VideoFile { thumbnailData?: string; }

declare global {
    interface File { path: string; }
}

const CURRENT_VERSION = "v1.0.4"
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/xptea/skibidislicer-go/refs/heads/main/frontend/src/version.txt"

function App() {
    const [dir, setDir] = useState("")
    const [recentVideos, setRecentVideos] = useState<VideoWithThumbnail[]>([])
    const [currentPage, setCurrentPage] = useState('home')
    const [selectedVideo, setSelectedVideo] = useState("")
    const [dragOver, setDragOver] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [latestVersion, setLatestVersion] = useState("")
    const [isMaximized, setIsMaximized] = useState(false)
    
    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        const videoFile = files.find(file => 
            file.type.startsWith('video/') || 
            file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)
        )
        if (videoFile) {
            try {
                const buffer = await videoFile.arrayBuffer()
                const path = await HandleFileUpload(Array.from(new Uint8Array(buffer)), videoFile.name)
                setSelectedVideo(path)
                setCurrentPage('videoEditor')
            } catch (error) {
                console.error('Upload failed:', error)
            }
        }
    }

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault()
        setDragOver(false)
    }

    const handleSelectVideo = async () => {
        try {
            const videoPath = await SelectVideo()
            if (videoPath) {
                setSelectedVideo(videoPath)
                setCurrentPage('videoEditor')
            }
        } catch (error) {
            console.error('Error selecting video:', error)
        }
    }

    const getRecentVideos = async () => {
        try {
            if (!dir) {
                const location = await GetWatchLocation()
                if (location) {
                    setDir(location)
                    const latest = await GetLatestVideos(location)
                    setRecentVideos(latest)
                }
            } else {
                const latest = await GetLatestVideos(dir)
                setRecentVideos(latest)
            }
        } catch (error) {
            console.error('Error fetching recent videos:', error)
        }
    }

    const forceRefresh = useCallback(async () => {
        const location = await GetWatchLocation()
        if (location) {
            setDir(location)
            const latest = await GetLatestVideos(location)
            setRecentVideos(latest)
        }
    }, [])

    useEffect(() => {
        const handleFileEvent = async () => {
            await forceRefresh()
        }

        EventsOn("file-created", handleFileEvent)
        EventsOn("file-changed", handleFileEvent)
        EventsOn("file-removed", handleFileEvent)
        EventsOn("file-renamed", handleFileEvent)
        EventsOn("refresh-videos", handleFileEvent)
        EventsOn("directory-changed", handleFileEvent)
        EventsOn("thumbnail-ready", handleFileEvent)

        forceRefresh()

        const refreshInterval = setInterval(forceRefresh, 2000)

        return () => {
            EventsOff("file-created")
            EventsOff("file-changed")
            EventsOff("file-removed")
            EventsOff("file-renamed")
            EventsOff("refresh-videos")
            EventsOff("directory-changed")
            EventsOff("thumbnail-ready")
            clearInterval(refreshInterval)
        }
    }, [])

    const checkForUpdates = async () => {
        try {
            const response = await fetch(VERSION_CHECK_URL)
            if (!response.ok) throw new Error(`Failed to fetch version: ${response.status}`)
            const versionText = await response.text()
            const cleanVersion = versionText.trim()
            if (cleanVersion !== CURRENT_VERSION && cleanVersion !== "") {
                setLatestVersion(cleanVersion)
                setUpdateAvailable(true)
                localStorage.setItem('updateAvailable', 'true')
                localStorage.setItem('latestVersion', cleanVersion)
            } else {
                setUpdateAvailable(false)
                localStorage.removeItem('updateAvailable')
                localStorage.removeItem('latestVersion')
            }
        } catch (error) {
            console.error("Failed to check for updates:", error)
        }
    }
    
    const handleUpdate = () => {
        window.open('https://github.com/xptea/skibidislicer-go/releases/latest/download/Skibidi.Slicer-amd64-installer.exe', '_blank')
    }

    const checkLocalStorageForUpdates = () => {
        const storedUpdateAvailable = localStorage.getItem('updateAvailable') === 'true'
        const storedVersion = localStorage.getItem('latestVersion') || ""
        if (storedUpdateAvailable && storedVersion && storedVersion !== CURRENT_VERSION) {
            setUpdateAvailable(true)
            setLatestVersion(storedVersion)
        } else {
            localStorage.removeItem('updateAvailable')
            localStorage.removeItem('latestVersion')
        }
    }

    const handleThumbnail = () => {
        if (dir) {
            getRecentVideos()
        }
    }

    const debounceTimeout = useRef<NodeJS.Timeout>()

    const debouncedGetRecentVideos = () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(() => {
            getRecentVideos()
        }, 100)
    }

    const initializeSettings = async () => {
        try {
            const location = await GetWatchLocation()
            if (location) {
                setDir(location)
                await getRecentVideos()
            }
            checkLocalStorageForUpdates()
            checkForUpdates()
        } catch (error) {
            console.error('Error initializing settings:', error)
        }
    }

    const saveAndVerifyLocations = async (dir: string) => {
        try {
            await SaveWatchLocation(dir)
            setDir(dir)
            await getRecentVideos()
        } catch (error) {
            console.error('Error saving location:', error)
        }
    }

    useEffect(() => {
        initializeSettings()

        const refreshRecentVideos = () => {
            console.log('Refreshing recent videos')
            getRecentVideos()
        }

        EventsOn("file-created", refreshRecentVideos)
        EventsOn("file-changed", refreshRecentVideos)
        EventsOn("file-removed", refreshRecentVideos)
        EventsOn("file-renamed", refreshRecentVideos)
        EventsOn("refresh-videos", refreshRecentVideos)
        EventsOn("directory-changed", GetWatchLocation)
        EventsOn("thumbnail-ready", handleThumbnail)

        refreshRecentVideos()

        return () => {
            EventsOff("file-created")
            EventsOff("file-changed")
            EventsOff("file-removed")
            EventsOff("file-renamed")
            EventsOff("refresh-videos")
            EventsOff("directory-changed")
            EventsOff("thumbnail-ready")
        }
    }, [dir])  // Add dir as dependency to ensure event handlers are updated

    useEffect(() => {
        if (dir) {
            getRecentVideos()
        }
    }, [dir])

    const checkMaximized = async () => {
        try {
            const maximized = await WindowIsMaximised()
            setIsMaximized(maximized)
        } catch (error) {
            console.error("Failed to check maximized state:", error)
        }
    }

    useEffect(() => {
        checkMaximized()
    }, [currentPage])

    useEffect(() => {
        const setWindowSizeIfNeeded = async () => {
            const maximized = await WindowIsMaximised()
            if (maximized) return
            
            if (currentPage === 'home') {
                WindowSetSize(800, 710)
            } else if (currentPage === 'videoEditor') {
                WindowSetSize(800, 850)
            } else if (currentPage === 'settings') {
                WindowSetSize(800, 705)
            }
        }
        
        setWindowSizeIfNeeded()
    }, [currentPage])

    if (currentPage === 'videoEditor') return (
        <div className="flex flex-col h-screen text-white">
            <WindowHeader title="Skibidi Slicer" setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <VideoEditor setCurrentPage={setCurrentPage} videoPath={selectedVideo} />
        </div>
    )
    
    if (currentPage === 'settings') return (
        <div className="flex flex-col h-screen text-white">
            <WindowHeader title="Skibidi Slicer" setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <Settings setCurrentPage={setCurrentPage} onSettingsSaved={GetWatchLocation} />
        </div>
    )

    return (
        <div className="flex flex-col h-screen text-white">
            <WindowHeader title="Skibidi Slicer" setCurrentPage={setCurrentPage} currentPage={currentPage} />
            
            <main className="flex-1 p-8 flex flex-col items-center bg-black">
                {updateAvailable && (
                    <div className="mb-4 px-3 py-2 bg-amber-600/20 border border-amber-500/30 rounded-lg text-sm font-medium text-amber-400 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Update Available: {latestVersion}</span>
                        <button 
                            onClick={handleUpdate} 
                            className="ml-2 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded text-xs transition-colors"
                        >
                            Update Now
                        </button>
                    </div>
                )}
                
                <div className={`max-w-4xl w-full text-center border-2 ${dragOver ? 'border-emerald-400/50' : 'border-zinc-800'} rounded-2xl p-16 transition-colors backdrop-blur-sm bg-zinc-900/30`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}>
                    <div className="space-y-5">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">Drag Video File</h2>
                            <p className="text-zinc-300 text-sm">Supported formats: MP4, MOV, AVI, MKV, WEBM</p>
                        </div>
                        <button onClick={handleSelectVideo} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
                            Browse Files
                        </button>
                    </div>
                </div>

                <section className="mt-12 w-full max-w-4xl">
                    <div className="border-b border-zinc-800 pb-4 mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                            </svg>
                            Recent Files
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {recentVideos.map((video, index) => (
                            <div key={index} className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 hover:border-emerald-400/30 transition-colors cursor-pointer"
                                onClick={() => { setSelectedVideo(video.path); setCurrentPage('videoEditor') }}>
                                <div className="aspect-video bg-zinc-900 rounded-lg mb-3 overflow-hidden">
                                    {video.id ? (
                                        <img src={`http://localhost:34115/thumbnails/${video.id}`} alt={video.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800/50 text-zinc-500">
                                            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                                                <path d="M12 8V12L15 15"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-white truncate">{video.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-zinc-800 py-4 px-6 bg-black/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-zinc-500">
                    <div>© {new Date().getFullYear()} SkibidiSlicer</div>
                    <div className="flex items-center gap-4">
                        <span>{CURRENT_VERSION}</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default App
