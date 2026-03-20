import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
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

export default function Wisata() {
    const [destinations, setDestinations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop');
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
            if (data.wisata_banner && data.wisata_banner.trim() !== '') {
                setBannerImage(data.wisata_banner);
            }
        } catch (error) {
            console.error('Failed to fetch banner:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/destination-categories?type=wisata');
            const data = await response.json();
            setCategories(data.filter(c => c.isActive));

            // Fetch subcategories
            const subResponse = await fetch('/api/destination-subcategories');
            const subData = await subResponse.json();
            setSubcategories(subData.filter(s => s.isActive && s.categoryType === 'wisata'));
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

    // Group destinations by category (using categoryId or fallback to category text)
    const destinationSections = categories.map(cat => {
        // Get subcategories for this category
        const catSubcats = subcategories.filter(s => s.categoryId === cat.id);

        // Get destinations for this category
        let categoryDestinations = destinations.filter(dest =>
            dest.categoryId === cat.id ||
            dest.categoryIds?.includes(cat.id) ||
            dest.category === cat.name ||
            dest.category === cat.slug
        );

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            categoryDestinations = categoryDestinations.filter(d => 
                d.name.toLowerCase().includes(q) || 
                (d.category && d.category.toLowerCase().includes(q)) ||
                (d.subcategory && d.subcategory.toLowerCase().includes(q))
            );
        }

        return {
            id: cat.slug,
            title: cat.name,
            bannerImage: cat.bannerImage,
            subcategories: catSubcats,
            destinations: categoryDestinations
        };
    }).filter(section => section.destinations.length > 0);

    const videoId = getYouTubeVideoId(bannerImage);

    return (
        <AppLayout
            title="Wisata"
            subtitle="Blok M"
            activeCategory="wisata"
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
                                alt="Wisata"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop';
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
                ) : destinationSections.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <p className="text-grey-600 mb-2">Belum ada destinasi wisata</p>
                            <p className="text-grey-400 text-sm">Data akan segera ditambahkan</p>
                        </div>
                    </div>
                ) : (
                    destinationSections.map((section) => (
                        <DestinationSection key={section.id} section={section} subcategories={subcategories} />
                    ))
                )}
            </div>
        </AppLayout>
    );
}

// Section Component with Subcategory Banner
function DestinationSection({ section, subcategories }) {
    const [showAll, setShowAll] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (showAll || section.destinations.length <= 10) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setShowAll(true);
                }
            },
            { root: scrollRef.current, threshold: 0.1 }
        );

        const lastChild = scrollRef.current?.querySelector('.last-item-sentinel');
        if (lastChild) {
            observer.observe(lastChild);
        }

        return () => observer.disconnect();
    }, [showAll, section.destinations.length]);

    // Get subcategories for this section's category
    const sectionSubcats = subcategories.filter(s => s.categoryId === section.subcategories?.[0]?.categoryId);

    // Find banner from subcategory or use category banner
    const sectionBanner = section.bannerImage;
    const bannerVideoId = getYouTubeVideoId(sectionBanner);

    return (
        <div className="py-1.5 pr-2.5">
            {/* ... (existing banner/header code) ... */}
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

            {!sectionBanner && (
                <div className="flex items-center gap-1.5 px-5 pt-2.5 pb-2">
                    <h2 className="font-bold text-[15px] text-black capitalize flex-1">
                        {section.title}
                    </h2>
                </div>
            )}

            {/* Horizontal Scroll Cards */}
            <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5 px-2.5 pb-2">
                    {section.destinations.slice(0, showAll ? undefined : 10).map((dest, idx, arr) => (
                        <React.Fragment key={dest.id}>
                            <DestinationCard destination={dest} />
                            {!showAll && idx === arr.length - 1 && (
                                <div className="last-item-sentinel w-10 h-1 flex-shrink-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Destination Card Component matching Figma design
function DestinationCard({ destination }) {
    const navigate = useNavigate();
    const userLocation = useUserLocation();
    const imageUrl = destination.image || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop';

    // Prioritize dynamically calculated distance if user location is available
    let distanceInKm = destination.distance_from_station ?? destination.distanceFromStation;
    if (userLocation && destination.lat && destination.lng) {
        distanceInKm = calculateDistance(userLocation.lat, userLocation.lng, destination.lat, destination.lng);
    }

    const distance = formatDistance(distanceInKm);

    return (
        <div
            onClick={() => navigate(`/wisata/${destination.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/wisata/${destination.id}`)}
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
