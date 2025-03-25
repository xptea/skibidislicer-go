import { useState, useEffect, DragEvent } from 'react'
import VideoEditor from './VideoEditor'
import Settings from './Settings'
import { GetLatestVideos, GetWatchLocation, SelectVideo, HandleFileUpload } from '../wailsjs/wailsjs/go/main/App'
import { EventsOn, EventsOff } from '../wailsjs/wailsjs/runtime/runtime'
import { main } from '../wailsjs/wailsjs/go/models'

interface VideoWithThumbnail extends main.VideoFile { thumbnailData?: string; }

declare global {
    interface File { path: string; }
}

const CURRENT_VERSION = "v1.0.2"
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/xptea/skibidislicer-go/refs/heads/main/frontend/src/version.txt"

function App() {
    const [dir, setDir] = useState("")
    const [recentVideos, setRecentVideos] = useState<VideoWithThumbnail[]>([])
    const [currentPage, setCurrentPage] = useState('home')
    const [selectedVideo, setSelectedVideo] = useState("")
    const [dragOver, setDragOver] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [latestVersion, setLatestVersion] = useState("")
    
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

    const getRecentVideos = async() => {
        const latest = await GetLatestVideos(dir)
        setRecentVideos(latest)
    }

    const reloadWatchLocation = async () => {
        const location = await GetWatchLocation()
        setDir(location)
        await getRecentVideos()
    }
    
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

    useEffect(() => {
        const handleFileChange = async () => {
            if (dir) await getRecentVideos()
        }
        const handleThumbnail = async (id: string) => {
            try {
                const response = await fetch(`/thumbnails/${id}`)
                if (!response.ok) throw new Error('Failed to fetch thumbnail')
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onloadend = () => {
                    setRecentVideos(prev => prev.map(video => video.id === id ? { ...video, thumbnailData: reader.result as string } : video))
                }
                reader.readAsDataURL(blob)
            } catch (err) {
                console.error(err)
            }
        }
        EventsOn("thumbnail-ready", handleThumbnail)
        EventsOn("file-created", handleFileChange)
        EventsOn("file-changed", handleFileChange)
        EventsOn("file-removed", handleFileChange)
        EventsOn("file-renamed", handleFileChange)
        const offDirectoryChanged = EventsOn("directory-changed", reloadWatchLocation)
        const loadWatchLocation = async () => {
            const location = await GetWatchLocation()
            if (location) setDir(location)
        }
        loadWatchLocation()
        checkLocalStorageForUpdates()
        checkForUpdates()
        document.body.classList.add('bg-black', 'text-zinc-100')
        const metaTheme = document.createElement('meta')
        metaTheme.name = 'theme-color'
        metaTheme.content = '#000000'
        document.head.appendChild(metaTheme)
        return () => {
            document.head.removeChild(metaTheme)
            EventsOff("thumbnail-ready")
            EventsOff("file-created")
            EventsOff("file-changed")
            EventsOff("file-removed")
            EventsOff("file-renamed")
            EventsOff("directory-changed")
            offDirectoryChanged()
        }
    }, [])

    useEffect(() => {
        if (dir) getRecentVideos()
    }, [dir])

    if (currentPage === 'videoEditor') return <VideoEditor setCurrentPage={setCurrentPage} videoPath={selectedVideo} />
    if (currentPage === 'settings') return <Settings setCurrentPage={setCurrentPage} onSettingsSaved={reloadWatchLocation} />

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
            <header className="border-b border-zinc-800 bg-black/95 backdrop-blur-sm py-4 px-6 sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <h1 className="text-xl font-semibold tracking-tight">
                        <span className="bg-white bg-clip-text text-transparent">
                            Skibidi Slicer
                        </span>
                    </h1>
                    <nav className="flex items-center gap-4">
                        {updateAvailable && (
                            <button onClick={handleUpdate} className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Update Available
                            </button>
                        )}
                        <button onClick={() => setCurrentPage('settings')} className="px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm font-medium">
                            Settings
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 p-8 flex flex-col items-center ">
                <div className={`max-w-4xl w-full text-center border-2 ${dragOver ? 'border-emerald-400/50' : 'border-zinc-800'} rounded-2xl p-16 transition-colors backdrop-blur-sm bg-zinc-900/30`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}>
                    <div className="space-y-5">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">Drag Video File</h2>
                            <p className="text-zinc-400 text-sm">Supported formats: MP4, MOV, AVI, MKV, WEBM</p>
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
                                    <span className="text-sm font-medium text-zinc-300 truncate">{video.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-zinc-800 mt-24 py-4 px-6 bg-black/95 backdrop-blur-sm">
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