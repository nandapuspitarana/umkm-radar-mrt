import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import AppLayout from '../components/AppLayout';

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

// Category titles matching database categories
const categoryTitles = {
    'sejarah-museum': 'Wisata Sejarah & Museum',
    'budaya-seni': 'Wisata Budaya & Seni',
    'religi': 'Wisata Religi',
    'alam-ruang-terbuka': 'Wisata Alam & Ruang Terbuka',
    'keluarga-rekreasi': 'Wisata Keluarga & Rekreasi',
    'edukasi': 'Wisata Edukasi',
    'belanja': 'Wisata Belanja',
};

export default function Wisata() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannerUrl, setBannerUrl] = useState('');
    const [bannerLoading, setBannerLoading] = useState(true);

    useEffect(() => {
        fetchDestinations();
        fetchBanner();
    }, []);

    const fetchBanner = async () => {
        setBannerLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.wisata_banner) {
                setBannerUrl(data.wisata_banner);
            }
        } catch (error) {
            console.error('Failed to fetch wisata banner:', error);
        } finally {
            setBannerLoading(false);
        }
    };

    const fetchDestinations = async () => {
        try {
            const response = await fetch('/api/destinations');
            const data = await response.json();
            setDestinations(data);
        } catch (error) {
            console.error('Failed to fetch destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group destinations by category
    const destinationSections = Object.entries(categoryTitles).map(([key, title]) => {
        const categoryDestinations = destinations.filter(dest => dest.category === key);
        return {
            id: key,
            title,
            destinations: categoryDestinations
        };
    }).filter(section => section.destinations.length > 0);

    return (
        <AppLayout
            title="Tempat Wisata Jakarta"
            subtitle="Senayan Mastercard"
            activeCategory="wisata"
        >
            <div className="pb-6">
                {/* Dynamic Banner */}
                <div className="p-[10px]">
                    <div className="relative w-full aspect-[3/2] max-h-[200px] bg-grey-300 rounded-[20px] overflow-hidden">
                        {bannerLoading ? (
                            <div className="w-full h-full bg-grey-200 animate-pulse" />
                        ) : (() => {
                            const videoId = getYouTubeVideoId(bannerUrl);
                            if (videoId) {
                                return (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="Wisata Banner"
                                    />
                                );
                            } else if (bannerUrl && (bannerUrl.endsWith('.mp4') || bannerUrl.endsWith('.webm'))) {
                                return (
                                    <video
                                        src={bannerUrl}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                );
                            } else {
                                return (
                                    <img
                                        src={bannerUrl || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop'}
                                        alt="Jakarta cityscape"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop';
                                        }}
                                    />
                                );
                            }
                        })()}
                    </div>
                </div>

                {/* Destination Sections */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-grey-600">Memuat destinasi wisata...</p>
                        </div>
                    </div>
                ) : destinationSections.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <p className="text-grey-600 mb-2">Belum ada destinasi wisata</p>
                            <p className="text-grey-400 text-sm">Data akan segera ditambahkan</p>
                        </div>
                    </div>
                ) : (
                    destinationSections.map((section) => (
                        <DestinationSection key={section.id} section={section} />
                    ))
                )}
            </div>
        </AppLayout>
    );
}

// Section Component
function DestinationSection({ section }) {
    return (
        <div className="flex flex-col gap-[10px] py-[5px] pr-[10px]">
            {/* Section Header */}
            <div className="flex items-center gap-[5px] pl-[20px] pr-[10px] pt-[10px]">
                <h2 className="font-bold text-[15px] text-black capitalize flex-1 leading-[0]">
                    <p className="leading-normal">{section.title}</p>
                </h2>
                <div className="flex items-center pt-[3px]">
                    <div className="transform -rotate-90">
                        <ChevronRight size={11} className="text-grey-600" />
                    </div>
                </div>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="overflow-x-auto no-scrollbar px-[10px]">
                <div className="flex gap-[5px]">
                    {section.destinations.map((dest) => (
                        <DestinationCard key={dest.id} destination={dest} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Destination Card Component matching Figma design
function DestinationCard({ destination }) {
    const navigate = useNavigate();
    const imageUrl = destination.image || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop';

    // Format distance properly - distance_from_station is in kilometers (DECIMAL format from DB)
    const formatDistance = (distanceInKm) => {
        if (!distanceInKm || distanceInKm === 0) return '0 m';

        // Convert to meters if less than 1 km
        if (distanceInKm < 1) {
            const meters = Math.round(distanceInKm * 1000);
            return `${meters} m`;
        }

        // Show in km if 1 km or more
        return `${distanceInKm.toFixed(1)} km`;
    };

    const distance = formatDistance(destination.distance_from_station);

    return (
        <div
            onClick={() => navigate(`/wisata/${destination.id}`)}
            className="w-[200px] h-[133px] rounded-[15px] overflow-hidden flex-shrink-0 cursor-pointer relative group"
        >
            {/* Background Image */}
            <img
                src={imageUrl}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop';
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

            {/* Distance Badge (Top Left) */}
            <div className="absolute top-5 left-5 flex items-center gap-1.5">
                <MapPin size={12} className="text-white" />
                <span className="text-white text-sm font-semibold lowercase">
                    {distance}
                </span>
            </div>

            {/* Title (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 pb-[15px] px-5">
                <p className="text-grey-200 text-sm font-semibold capitalize leading-normal">
                    {destination.name}
                </p>
            </div>
        </div>
    );
}
