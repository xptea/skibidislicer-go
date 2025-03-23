import React from 'react';
import VideoEditorContainer from './components/VideoEditorContainer';

interface VideoEditorProps {
    setCurrentPage: (page: string) => void;
    videoPath: string;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ setCurrentPage, videoPath }) => {
    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
            <header className="border-b border-zinc-900 bg-black py-4 px-6 shadow-md">
                <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="text-2xl sm:text-3xl font-bold">
                        <span className="text-zinc-100">Skibidi Slicer</span>
                    </div>
                    <nav className="flex gap-4 sm:gap-6">
                        <button className="hover:text-emerald-400 transition-colors text-sm sm:text-base" onClick={() => setCurrentPage('home')}>Home</button>
                        <button className="hover:text-emerald-400 transition-colors text-sm sm:text-base" onClick={() => setCurrentPage('settings')}>Settings</button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black">
                <div className="w-full max-w-4xl lg:max-w-6xl mx-auto">
                    <VideoEditorContainer videoPath={videoPath} />
                </div>
            </main>
        </div>
    );
};

export default VideoEditor;