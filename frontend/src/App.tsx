import './App.css'
import { useState, useEffect } from 'react'
import VideoEditor from './VideoEditor'
import Settings from './Settings'
import VoidNotesLogo from './assets/VoidNotes_LOGO.png'
import { GetLatestVideos } from '../wailsjs/go/main/App'

interface Video {
    Name: string;
    Thumbnail: string;
}

function App() {
    const dir = "/Users/benfoster/Documents/SkibidiSlices"
    const [recentVideos, setRecentVideos] = useState<Video[]>([]);
    
    const [currentPage, setCurrentPage] = useState('home');
    
    const getRecentVideos = async() => {
        const latest = await GetLatestVideos(dir);
        console.log(latest)
        const mappedVideos = latest.map(video => ({
            Name: video.name,
            Thumbnail: video.thumbnail,
        }));
        setRecentVideos(mappedVideos);
    }

    useEffect(() => {
        getRecentVideos()
        document.body.classList.add('bg-black', 'text-zinc-100');
        
        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = '#000000';
        document.head.appendChild(metaTheme);
        
        return () => {
          document.head.removeChild(metaTheme);
        };
    }, []);

    if (currentPage === 'videoEditor') {
        return <VideoEditor setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === 'settings') {
        return <Settings setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === 'home') {
        return (
            <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
                <header className="border-b border-zinc-900 bg-black py-4 px-6 shadow-md">
                    <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
                        <div className="text-3xl font-bold">
                            <span className="text-zinc-100">Skibidi<span className="text-emerald-500">Slicer</span></span>
                        </div>
                        <nav className="flex gap-6">
                            <button className="hover:text-emerald-400 transition-colors" onClick={() => setCurrentPage('settings')}>Settings</button>
                        </nav>
                    </div>
                </header>
                <main className="flex-1 p-8 flex flex-col items-center bg-gradient-to-b from-black to-zinc-900">
                    <div className="max-w-4xl w-full text-center border-dashed border-2 border-zinc-800 rounded-lg py-20 hover:border-zinc-700 transition-colors">
                        <h2 className="text-xl font-semibold mb-4">Drop your video file here</h2>
                        <p className="text-zinc-500 mb-4">or</p>
                        <button 
                            className="bg-emerald-700 hover:bg-emerald-600 text-white py-3 px-6 rounded-md transition-colors shadow-md"
                            onClick={() => setCurrentPage('videoEditor')}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {recentVideos.map((video, index) => (
                                <div 
                                    key={index} 
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col hover:border-zinc-700 transition-all cursor-pointer"
                                    onClick={() => setCurrentPage('videoEditor')}
                                >
                                    <div className="w-full h-32 bg-black mb-3 rounded-md flex items-center justify-center overflow-hidden">
                                        <img src={video.Thumbnail} alt={video.Thumbnail} className="h-full object-contain" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-zinc-300">{video.Name}</span>
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
                            VoidWorks company
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    return null;
}

export default App
