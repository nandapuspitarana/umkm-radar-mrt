import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { getImageUrl, getAssetUrl } from '../utils/api';

export default function StoryModal({ isOpen, onClose, story, onNext, onPrev }) {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true); // Default muted to ensure autoplay

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
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !story) return null;

    // Determine media type and source
    const isVideo = story.image && (story.image.match(/\.(mp4|webm|mov|m4v)$/i) || story.image.includes('data:video'));
    const mediaSrc = isVideo ? getAssetUrl(story.image) : getImageUrl(story.image, { w: 1080, h: 1920, resize: 'cover' });

    // Video Handling: Ensure reset on story change
    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay prevented:", error);
                    // Usually due to unmuted. We handle this by defaulting to muted.
                });
            }
        }
    }, [story.id, isVideo]); // Depend on story.id to restart

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
                >
                    {/* Close Button - High Z-Index */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-6 right-6 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    {/* Volume Toggle (Only for Video) */}
                    {isVideo && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                            className="absolute top-6 right-20 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                        >
                            {isMuted ? <VolumeX size={24} className="text-white" /> : <Volume2 size={24} className="text-white" />}
                        </button>
                    )}

                    {/* Navigation Overlays - Full Screen Invisible Layers */}
                    <div className="absolute inset-0 z-40 flex">
                        {/* Left Tap Area (30%) - Prev */}
                        <div
                            className="w-[30%] h-full cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); if (onPrev) onPrev(); }}
                        />
                        {/* Right Tap Area (70%) - Next */}
                        <div
                            className="w-[70%] h-full cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); if (onNext) onNext(); }}
                        />
                    </div>

                    {/* Story Content Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full h-full md:max-w-md md:max-h-[90vh] md:rounded-2xl overflow-hidden bg-black flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Progress Bar Animation */}
                        <div className="absolute top-4 left-4 right-16 h-1 bg-white/30 rounded-full overflow-hidden z-30 pointer-events-none">
                            <motion.div
                                key={story.id} // Restart animation on story change
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: isVideo ? 15 : 5, ease: 'linear' }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>

                        {/* Media Display */}
                        {isVideo ? (
                            <div className="w-full h-full relative bg-black">
                                <video
                                    ref={videoRef}
                                    src={mediaSrc}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    playsInline
                                    loop
                                    muted={isMuted} // Controlled mute state
                                    onError={(e) => console.error("Video load error", e.target.error, mediaSrc)}
                                />
                            </div>
                        ) : (
                            <img
                                src={mediaSrc}
                                alt={story.title || 'Story'}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Story Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-30">
                            <h3 className="text-white font-bold text-xl drop-shadow-md tracking-wide">{story.title}</h3>
                            {story.subtitle && (
                                <p className="text-white/90 text-sm mt-1 drop-shadow-md font-medium">{story.subtitle}</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
