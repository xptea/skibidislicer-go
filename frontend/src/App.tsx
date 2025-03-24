import { useState, useEffect, DragEvent } from 'react'
import VideoEditor from './VideoEditor'
import Settings from './Settings'
import { GetLatestVideos, GetWatchLocation, SelectVideo, HandleFileUpload } from '../wailsjs/wailsjs/go/main/App'
import { EventsOn } from '../wailsjs/wailsjs/runtime'
import { main } from '../wailsjs/wailsjs/go/models'

interface VideoWithThumbnail extends main.VideoFile {thumbnailData?: string;}

declare global {
    interface File {
        path: string;
    }
}

const CURRENT_VERSION = "v1.0.1"
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/xptea/skibidislicer-go/refs/heads/main/frontend/src/version.txt"

function App() {
    const [dir, setDir] = useState("")
    const [recentVideos, setRecentVideos] = useState<VideoWithThumbnail[]>([])
    const [currentPage, setCurrentPage] = useState('home')
    const [selectedVideo, setSelectedVideo] = useState<string>("")
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
    
    const checkForUpdates = async () => {
        try {
            const response = await fetch(VERSION_CHECK_URL)
            if (!response.ok) return
            
            const versionText = await response.text()
            const cleanVersion = versionText.trim()
            
            if (cleanVersion !== CURRENT_VERSION && cleanVersion !== "") {
                setLatestVersion(cleanVersion)
                setUpdateAvailable(true)
                localStorage.setItem('updateAvailable', 'true')
                localStorage.setItem('latestVersion', cleanVersion)
            }
        } catch (error) {
            console.error("Failed to check for updates:", error)
        }
    }
    
    const handleUpdate = () => {
        window.open('https://github.com/xptea/skibidislicer-go/releases/latest/download/skibidislicer-go-amd64-installer.exe', '_blank')
    }

    useEffect(() => {
        EventsOn("thumbnail-ready", async (id: string) => {
            try {
                const response = await fetch(`/thumbnails/${id}`)
                if (!response.ok) throw new Error('Failed to fetch thumbnail')
                const blob = await response.blob()
                const reader = new FileReader()
                reader.onloadend = () => {
                    setRecentVideos(prev => prev.map(video => {
                        if (video.id === id) {
                            return {
                                ...video,
                                thumbnailData: reader.result as string
                            }
                        }
                        return video
                    }))
                }
                reader.readAsDataURL(blob)
            } catch (err) {
                console.error('Error loading thumbnail:', err)
            }
        })

        const loadWatchLocation = async () => {
            const location = await GetWatchLocation()
            if (location) {
                setDir(location)
            }
        }
        
        const checkLocalStorageForUpdates = () => {
            const hasUpdate = localStorage.getItem('updateAvailable') === 'true'
            if (hasUpdate) {
                setUpdateAvailable(true)
                setLatestVersion(localStorage.getItem('latestVersion') || "")
            }
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
        }
    }, [])

    useEffect(() => {
        if (dir) {
            getRecentVideos()
        }
    }, [dir])

    if (currentPage === 'videoEditor') {
        return <VideoEditor setCurrentPage={setCurrentPage} videoPath={selectedVideo} />
    }

    if (currentPage === 'settings') {
        return <Settings setCurrentPage={setCurrentPage} />
    }

    if (currentPage === 'home') {
        return (
            <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
                <header className="border-b border-zinc-900 bg-black py-4 px-6 shadow-md">
                    <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
                        <div className="text-3xl font-bold">
                            <span className="text-zinc-100">SkibidiSlicer</span>
                        </div>
                        <nav className="flex gap-6 items-center">
                            {updateAvailable && (
                                <button
                                    className="bg-amber-600 text-white text-xs py-1 px-2 rounded-md flex items-center"
                                    onClick={handleUpdate}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Update v{latestVersion.replace('v', '')}
                                </button>
                            )}
                            <button className="hover:text-emerald-400 transition-colors" onClick={() => setCurrentPage('settings')}>Settings</button>
                        </nav>
                    </div>
                </header>
                <main className="flex-1 p-8 flex flex-col items-center bg-gradient-to-b from-black to-zinc-900">
                    <div 
                        className={`max-w-4xl w-full text-center border-dashed border-2 ${dragOver ? 'border-emerald-500' : 'border-zinc-800'} rounded-lg py-20 hover:border-zinc-700 transition-colors`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <h2 className="text-xl font-semibold mb-4">Drop your video file here</h2>
                        <p className="text-zinc-500 mb-4">or</p>
                        <button 
                            className="bg-emerald-700 hover:bg-emerald-600 text-white py-3 px-6 rounded-md transition-colors shadow-md"
                            onClick={handleSelectVideo}
                        >
                            Open Video File
                        </button>
                    </div>
                    <section className="mt-12 w-full max-w-4xl">
                        <h2 className="text-2xl font-semibold mb-6 text-zinc-100 flex items-center">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Recent Files
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                            {recentVideos.map((video, index) => (
                                <div 
                                    key={index} 
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col hover:border-zinc-700 transition-all cursor-pointer"
                                    onClick={() => {
                                        setSelectedVideo(video.path)
                                        setCurrentPage('videoEditor')
                                    }}
                                >
                                    <div className="w-full h-32 bg-black mb-3 rounded-md flex items-center justify-center overflow-hidden">
                                        {video.id ? (
                                            <img 
                                                src={`http://localhost:34115/thumbnails/${video.id}`}
                                                alt={video.name} 
                                                className="h-full object-contain" 
                                            />
                                        ) : (
                                            <div className="text-zinc-600">Loading...</div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-zinc-300">{video.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
                <footer className="border-t border-zinc-900 py-4 px-6 text-center text-zinc-600 text-sm mt-auto bg-black">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div>
                            SkibidiSlicer © {new Date().getFullYear()}
                        </div>
                        <div className="text-zinc-500">
                            A VoidWorks Company
                        </div>
                    </div>
                </footer>
            </div>
        )
    }

    return null
}

export default App