import React from 'react'
import VideoEditorContainer from './components/VideoEditorContainer'

interface VideoEditorProps {
    setCurrentPage: (page: string) => void
    videoPath: string
}

const VideoEditor: React.FC<VideoEditorProps> = ({ setCurrentPage, videoPath }) => {
    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
            <header className="border-b border-zinc-800 bg-black/95 backdrop-blur-sm py-4 px-6 sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <h1 className="text-xl font-semibold tracking-tight">
                        <span className="bg-white to-cyan-400 bg-clip-text text-transparent">
                            Skibidi Slicer
                        </span>
                    </h1>
                    <nav className="flex gap-4">
                        <button onClick={() => setCurrentPage('home')} className="px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm font-medium">
                            Home
                        </button>
                        <button onClick={() => setCurrentPage('settings')} className="px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm font-medium">
                            Settings
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 bg-black">
                <div className="w-full max-w-6xl mx-auto">
                    <VideoEditorContainer videoPath={videoPath} />
                </div>
            </main>
        </div>
    )
}

export default VideoEditor