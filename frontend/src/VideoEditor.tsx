import React from 'react'
import VideoEditorContainer from './components/VideoEditorContainer'

interface VideoEditorProps {
    setCurrentPage: (page: string) => void
    videoPath: string
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoPath }) => {
    return (
        <div className="flex-1 flex items-center justify-center p-4 bg-black">
            <div className="w-full max-w-6xl mx-auto">
                <VideoEditorContainer videoPath={videoPath} />
            </div>
        </div>
    )
}

export default VideoEditor