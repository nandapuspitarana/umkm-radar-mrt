import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play, AlertCircle, Loader2, MoreHorizontal } from 'lucide-react';
import { getImageUrl, getAssetUrl } from '../utils/api';

export default function StoryModal({ isOpen, onClose, story, stories = [], currentIndex = 0, onNext, onPrev }) {
    // --- HOOKS MUST BE AT TOP LEVEL (No conditional returns before hooks) ---
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [videoState, setVideoState] = useState({
        loading: true,
        error: false,
        playing: false
    });

    // Derive active story (Safe processing even if null)
    const activeStory = story;

    // Determine media type (Safe check)
    const isVideo = activeStory?.image && (activeStory.image.match(/\.(mp4|webm|mov|m4v)$/i) || activeStory.image.includes('data:video'));
    const mediaSrc = activeStory?.image ? (isVideo ? getAssetUrl(activeStory.image) : getImageUrl(activeStory.image, { w: 1080, h: 1920, resize: 'cover' })) : '';

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsMuted(true);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Reset state on story change
    useEffect(() => {
        if (isOpen && activeStory) {
            setProgress(0);
            setVideoState({ loading: true, error: false, playing: false });
            setIsPaused(false);
        }
    }, [activeStory?.id, isOpen]);

    // Image Timer Logic
    useEffect(() => {
        let interval;
        if (isOpen && activeStory && !isVideo && !videoState.loading && !isPaused && !videoState.error) {
            const duration = 5000;
            const step = 50;
            interval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + (100 / (duration / step));
                    if (newProgress >= 100) {
                        clearInterval(interval);
                        if (onNext) onNext();
                        return 100;
                    }
                    return newProgress;
                });
            }, step);
        }
        return () => clearInterval(interval);
    }, [isOpen, activeStory, isVideo, videoState.loading, isPaused, videoState.error, onNext]);

    // Video Handling
    useEffect(() => {
        if (isOpen && activeStory && isVideo && videoRef.current) {
            if (isPaused) {
                videoRef.current.pause();
            } else if (!videoState.loading && !videoState.error) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Autoplay prevented:", error);
                        setVideoState(prev => ({ ...prev, playing: false }));
                    });
                }
            }
        }
    }, [isOpen, activeStory, isVideo, isPaused, videoState.loading, videoState.error]);

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const { currentTime, duration } = videoRef.current;
            if (duration > 0) {
                const p = (currentTime / duration) * 100;
                setProgress(p);
            }
        }
    };

    const handleVideoEnded = () => {
        if (onNext) onNext();
    };

    const handleVideoLoaded = () => {
        setVideoState(prev => ({ ...prev, loading: false }));
        if (videoRef.current && !isPaused) {
            videoRef.current.play().catch(() => { });
        }
    };

    const handleVideoError = (e) => {
        console.error("Video Error:", e);
        setVideoState({ loading: false, error: true, playing: false });
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => setIsPaused(false);

    // --- RENDER: Safe Early Return for View Layer Only ---
    if (!isOpen || !activeStory) return null;

    return ReactDOM.createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#000' }}
                >
                    {/* Content Container (Mobile Aspect Ratio) */}
                    <div
                        className="relative w-full h-full md:max-w-[400px] md:max-h-[85vh] md:rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col"
                        style={{ backgroundColor: '#000' }} // Force black
                        onMouseDown={handleTouchStart}
                        onMouseUp={handleTouchEnd}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* 1. TOP HEADER OVERLAY */}
                        <div className="absolute top-0 left-0 right-0 z-50 p-3 pt-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                            {/* Progress Bars */}
                            <div className="flex gap-1.5 h-1 mb-3">
                                {stories.map((s, idx) => (
                                    <div key={s.id} className="flex-1 bg-white/30 rounded-full h-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-white transition-all duration-100 ease-linear rounded-full box-border"
                                            style={{
                                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* User Info & Controls */}
                            <div className="flex items-center justify-between pointer-events-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-white/20 p-0.5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                                        <div className="bg-white w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                                            UM
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-xs font-bold drop-shadow-md">UMKM Radar MRT</span>
                                        <span className="text-white/80 text-[10px] drop-shadow-md">Sponsored</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {isVideo && !videoState.error && (
                                        <button
                                            onClick={toggleMute}
                                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/40 backdrop-blur-md transition-colors"
                                        >
                                            {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/40 backdrop-blur-md transition-colors"
                                    >
                                        <X size={16} className="text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. MEDIA CONTENT */}
                        <div className="flex-1 relative bg-black flex items-center justify-center" style={{ backgroundColor: '#000' }}>
                            {/* Navigation Tap Zones (Invisible) */}
                            <div className="absolute inset-0 z-40 flex">
                                <div
                                    className="w-[30%] h-full outline-none"
                                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                                    onClick={(e) => { e.stopPropagation(); if (onPrev) onPrev(); }}
                                />
                                <div
                                    className="w-[70%] h-full outline-none"
                                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                                    onClick={(e) => { e.stopPropagation(); if (onNext) onNext(); }}
                                />
                            </div>

                            {/* Loading Spinner */}
                            {videoState.loading && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-lg" />
                                </div>
                            )}

                            {/* Error State */}
                            {(videoState.error) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                    <AlertCircle className="w-12 h-12 text-red-500 mb-2 drop-shadow-lg" />
                                    <p className="text-white font-medium drop-shadow-lg">Gagal memuat media</p>
                                    <button
                                        className="mt-4 px-4 py-2 bg-white/20 rounded-full text-white text-sm pointer-events-auto backdrop-blur-md"
                                        onClick={(e) => { e.stopPropagation(); videoRef.current?.load(); }}
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            )}

                            {/* Actual Media */}
                            <motion.div
                                key={activeStory.id}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full flex items-center justify-center bg-black"
                                style={{ backgroundColor: '#000' }}
                            >
                                {isVideo ? (
                                    <video
                                        ref={videoRef}
                                        src={mediaSrc}
                                        className="w-full h-full object-cover"
                                        playsInline
                                        loop={false}
                                        muted={isMuted}
                                        onLoadedData={handleVideoLoaded}
                                        onTimeUpdate={handleVideoTimeUpdate}
                                        onEnded={handleVideoEnded}
                                        onError={handleVideoError}
                                        style={{ backgroundColor: '#000' }}
                                    />
                                ) : (
                                    <img
                                        src={mediaSrc}
                                        alt={activeStory.title}
                                        className="w-full h-full object-cover"
                                        onLoad={handleVideoLoaded}
                                        onError={() => setVideoState({ loading: false, error: true })}
                                    />
                                )}
                            </motion.div>
                        </div>

                        {/* 3. CAPTION / TEXT OVERLAY (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-30">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-white font-bold text-xl drop-shadow-md tracking-wide leading-tight mb-1">{activeStory.title}</h3>
                                {activeStory.subtitle && (
                                    <p className="text-white/90 text-sm font-medium drop-shadow-md leading-relaxed opacity-90">{activeStory.subtitle}</p>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
