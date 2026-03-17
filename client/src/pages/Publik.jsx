import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useUserLocation, calculateDistance, formatDistance } from '../hooks/useUserLocation';

// Helper function to extract YouTube video ID
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

export default function Publik() {
    const [destinations, setDestinations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchDestinations();
        fetchBanner();
    }, []);

    const fetchBanner = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.publik_banner && data.publik_banner.trim() !== '') {
                setBannerImage(data.publik_banner);
            }
        } catch (error) {
            console.error('Failed to fetch banner:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/destination-categories?type=publik');
            const data = await response.json();
            setCategories(data.filter(c => c.isActive));

            // Fetch subcategories
            const subResponse = await fetch('/api/destination-subcategories');
            const subData = await subResponse.json();
            setSubcategories(subData.filter(s => s.isActive && s.categoryType === 'publik'));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
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

    // Get publik category IDs
    const publikCategoryIds = categories.map(c => c.id);

    // Filter destinations that belong to publik categories
    const publikDestinations = destinations.filter(dest =>
        publikCategoryIds.includes(dest.categoryId) ||
        dest.category === 'Publik' ||
        dest.category === 'Area Publik'
    );

    // Group destinations by subcategory (for publik, subcategories are the main sections)
    const destinationSections = subcategories.map(subcat => {
        let subcatDestinations = publikDestinations.filter(dest =>
            dest.subcategoryId === subcat.id ||
            dest.subcategory === subcat.name
        );

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            subcatDestinations = subcatDestinations.filter(d => 
                d.name.toLowerCase().includes(q) || 
                (d.category && d.category.toLowerCase().includes(q)) ||
                (d.subcategory && d.subcategory.toLowerCase().includes(q))
            );
        }

        return {
            id: subcat.slug,
            title: subcat.name,
            bannerImage: subcat.bannerImage,
            destinations: subcatDestinations
        };
    }).filter(section => section.destinations.length > 0);

    // If no subcategories, group by categories
    const categorySections = categories.map(cat => {
        let catDestinations = publikDestinations.filter(dest =>
            dest.categoryId === cat.id ||
            dest.category === cat.name
        );

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            catDestinations = catDestinations.filter(d => 
                d.name.toLowerCase().includes(q) || 
                (d.category && d.category.toLowerCase().includes(q)) ||
                (d.subcategory && d.subcategory.toLowerCase().includes(q))
            );
        }

        return {
            id: cat.slug,
            title: cat.name,
            bannerImage: cat.bannerImage,
            destinations: catDestinations
        };
    }).filter(section => section.destinations.length > 0);

    // Use subcategory sections if available, otherwise use category sections
    const finalSections = destinationSections.length > 0 ? destinationSections : categorySections;

    const videoId = getYouTubeVideoId(bannerImage);

    return (
        <AppLayout
            title="Fasilitas Umum / Ruang Publik"
            subtitle="Blok M"
            activeCategory="publik"
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            <div className="pb-6">
                {/* Banner Image/Video */}
                {!searchQuery && (
                    <div className="p-2.5">
                    <div className="relative w-full aspect-video bg-grey-900 rounded-[20px] overflow-hidden">
                        {videoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&vq=hd720`}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '100%',
                                    height: '100%',
                                    transform: 'translate(-50%, -50%) scale(1.05)',
                                    border: 'none',
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Banner Video"
                            />
                        ) : bannerImage && (bannerImage.endsWith('.mp4') || bannerImage.endsWith('.webm') || bannerImage.includes('video')) ? (
                            <video
                                src={bannerImage}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={bannerImage}
                                alt="Ruang Publik"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop';
                                }}
                            />
                        )}
                    </div>
                </div>
                )}

                {/* Destination Sections */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-grey-600">Memuat destinasi...</p>
                        </div>
                    </div>
                ) : finalSections.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <p className="text-grey-600 mb-2">Belum ada destinasi publik</p>
                            <p className="text-grey-400 text-sm">Data akan segera ditambahkan</p>
                        </div>
                    </div>
                ) : (
                    finalSections.map((section) => (
                        <DestinationSection key={section.id} section={section} />
                    ))
                )}
            </div>
        </AppLayout>
    );
}

// Section Component with Banner
function DestinationSection({ section }) {
    const [showAll, setShowAll] = useState(false);
    const sectionBanner = section.bannerImage;
    const bannerVideoId = getYouTubeVideoId(sectionBanner);

    return (
        <div className="py-1.5 pr-2.5">
            {/* Subcategory Banner (if exists) */}
            {sectionBanner && (
                <div className="px-2.5 mb-2">
                    <div className="relative w-full h-32 rounded-[15px] overflow-hidden">
                        {bannerVideoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${bannerVideoId}?autoplay=1&mute=1&loop=1&playlist=${bannerVideoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                                className="absolute inset-0 w-full h-full"
                                style={{ border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title={`${section.title} Banner`}
                            />
                        ) : sectionBanner.endsWith('.mp4') || sectionBanner.endsWith('.webm') ? (
                            <video
                                src={sectionBanner}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={sectionBanner.startsWith('http') ? sectionBanner : `/api/assets/${sectionBanner}`}
                                alt={section.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4">
                            <h3 className="text-white font-bold text-lg">{section.title}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Header (if no banner) */}
            {!sectionBanner && (
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
            )}

            {/* Horizontal Scroll Cards */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5 px-2.5">
                    {section.destinations.slice(0, showAll ? undefined : 10).map((dest) => (
                        <DestinationCard key={dest.id} destination={dest} />
                    ))}
                </div>
            </div>

            {/* Show More Button */}
            {section.destinations.length > 10 && !showAll && (
                <div className="px-5 py-2">
                    <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="text-primary text-sm font-medium"
                    >
                        Lihat Semua ({section.destinations.length})
                    </button>
                </div>
            )}
        </div>
    );
}

// Destination Card Component matching Figma design
function DestinationCard({ destination }) {
    const navigate = useNavigate();
    const userLocation = useUserLocation();
    const imageUrl = destination.image || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop';

    // Prioritize dynamically calculated distance if user location is available
    let distanceInKm = destination.distance_from_station ?? destination.distanceFromStation;
    if (userLocation && destination.lat && destination.lng) {
        distanceInKm = calculateDistance(userLocation.lat, userLocation.lng, destination.lat, destination.lng);
    }

    const distance = formatDistance(distanceInKm);

    return (
        <div
            onClick={() => navigate(`/publik/${destination.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/publik/${destination.id}`)}
            role="button"
            tabIndex={0}
            className="w-[200px] h-[133px] rounded-[15px] overflow-hidden flex-shrink-0 cursor-pointer relative group"
        >
            {/* Background Image */}
            <img
                src={imageUrl}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop';
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
