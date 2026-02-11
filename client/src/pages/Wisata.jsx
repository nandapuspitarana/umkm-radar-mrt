import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Play } from 'lucide-react';
import AppLayout from '../components/AppLayout';

// Category mapping for display titles
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

    useEffect(() => {
        fetchDestinations();
    }, []);

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
                {/* Video Banner Placeholder */}
                <div className="p-2.5">
                    <div className="relative w-full aspect-[3/2] max-h-[200px] bg-grey-300 rounded-2xl overflow-hidden flex items-center justify-center">
                        <img
                            src="https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop"
                            alt="Jakarta cityscape"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <button className="absolute w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                            <Play size={32} className="text-grey-600 ml-1" fill="currentColor" />
                        </button>
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
        <div className="py-2">
            {/* Section Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <h2 className="font-bold text-[15px] text-black capitalize">
                    {section.title}
                </h2>
                <ChevronRight size={16} className="text-grey-600" />
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="overflow-x-auto no-scrollbar px-2.5">
                <div className="flex gap-1.5">
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
    const imageUrl = destination.image_url || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop';
    const distance = destination.distance_from_station
        ? `${(destination.distance_from_station / 1000).toFixed(1)} km`
        : 'N/A';

    return (
        <div className="w-[200px] h-[133px] rounded-[15px] overflow-hidden flex-shrink-0 cursor-pointer relative group">
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
            <div className="absolute bottom-4 left-5 right-5">
                <p className="text-grey-200 text-sm font-semibold capitalize leading-tight">
                    {destination.name}
                </p>
                {destination.description && (
                    <p className="text-grey-200 text-xs opacity-80 leading-tight mt-0.5 line-clamp-2">
                        {destination.description}
                    </p>
                )}
            </div>
        </div>
    );
}
