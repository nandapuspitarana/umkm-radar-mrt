import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function StoryModal({ isOpen, onClose, story }) {
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

    return (
        <AnimatePresence>
            {isOpen && story && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                    onClick={onClose}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    {/* Story Content */}
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="relative max-w-md w-full h-full max-h-[90vh] mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Progress Bar (placeholder for future enhancement) */}
                        <div className="absolute top-4 left-4 right-12 h-1 bg-white/30 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>

                        {/* Story Content - Image or Video */}
                        {story.image && (story.image.match(/\.(mp4|webm|mov)$/i) || story.image.includes('data:video')) ? (
                            <video
                                src={story.image}
                                className="w-full h-full object-contain"
                                autoPlay
                                controls
                                playsInline
                            />
                        ) : (
                            <img
                                src={story.image}
                                alt={story.title || 'Story'}
                                className="w-full h-full object-contain"
                            />
                        )}

                        {/* Story Info */}
                        {story.title && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white font-bold text-lg">{story.title}</h3>
                                {story.subtitle && (
                                    <p className="text-white/80 text-sm">{story.subtitle}</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
