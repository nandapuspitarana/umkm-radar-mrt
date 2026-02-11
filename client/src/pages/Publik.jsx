import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';

// Category mapping for display titles
const categoryTitles = {
    'ruang-terbuka-olahraga': 'Ruang Terbuka Dan Olahraga',
    'mall-plaza': 'Mall & Plaza Terbuka',
    'infrastruktur-transit': 'Infrastruktur Pejalan & Transit',
    'sosial-keagamaan': 'Fasilitas Sosial & Keagamaan',
};

export default function Publik() {
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
            title="Fasilitas Umum / Ruang Publik"
            subtitle="Senayan Mastercard"
            activeCategory="publik"
        >
            <div className="pb-6">
                {/* Banner Image */}
                <div className="p-2.5">
                    <div className="relative w-full aspect-[3/2] max-h-[200px] max-w-[600px] bg-grey-900 rounded-[20px] overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop"
                            alt="Ruang Publik"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Destination Sections */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-grey-600">Memuat destinasi...</p>
                        </div>
                    </div>
                ) : destinationSections.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <p className="text-grey-600 mb-2">Belum ada destinasi publik</p>
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
        <div className="py-1.5 pr-2.5">
            {/* Section Header */}
            <div className="flex items-center gap-1.5 px-5 pt-2.5 pb-2">
                <h2 className="font-bold text-[15px] text-black capitalize flex-1">
                    {section.title}
                </h2>
                <div className="flex items-center pt-0.5">
                    <div className="flex items-center justify-center h-[11px] w-[10px] -rotate-90">
                        <ChevronRight size={10} className="text-grey-600" />
                    </div>
                </div>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5 px-2.5">
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
    // Use 'image' field from database
    const imageUrl = destination.image || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop';

    // Format distance properly - distance_from_station is in kilometers
    const formatDistance = (distanceKm) => {
        if (!distanceKm && distanceKm !== 0) return '0 m';

        if (distanceKm < 1) {
            // Convert to meters for distances less than 1 km
            return `${Math.round(distanceKm * 1000)} m`;
        }
        // Show in km for distances >= 1 km
        return `${distanceKm.toFixed(1)} km`;
    };

    const distance = formatDistance(destination.distance_from_station);

    return (
        <div className="w-[200px] h-[133px] rounded-[15px] overflow-hidden flex-shrink-0 cursor-pointer relative group">
            {/* Background Image */}
            <img
                src={imageUrl}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop';
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

            {/* Distance Badge (Top Left) */}
            <div className="absolute top-5 left-5 flex items-center gap-1.5">
                <MapPin size={12} className="text-white" fill="white" />
                <span className="text-white text-sm font-semibold lowercase">
                    {distance}
                </span>
            </div>

            {/* Title (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-[15px]">
                <p className="text-sm font-semibold text-grey-200 capitalize leading-normal whitespace-pre-wrap">
                    {destination.name}
                </p>
            </div>
        </div>
    );
}
