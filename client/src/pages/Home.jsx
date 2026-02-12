import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { getImageUrl, getAssetUrl } from '../utils/api';
import AppLayout from '../components/AppLayout';
import TransportLinks from '../components/TransportLinks';
import ContentSection, { ContentCard, FavoriteCard, StackedCards } from '../components/ContentSection';
import StoryModal from '../components/StoryModal';

// Quick access content - Figma matching
const quickAccessContent = [
    { id: 1, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=400&fit=crop', title: 'Buat yang', subtitle: 'Belum Sarapan' },
    { id: 2, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', title: 'Butuh Ngopi', subtitle: 'Takeaway' },
    { id: 3, image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=400&fit=crop', title: 'Parkir Seharian', subtitle: 'Tarif Flat' },
    { id: 4, image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&h=400&fit=crop', title: 'Masjid/', subtitle: 'Mushala' },
];

// Stacked items for quick access
const stackedItems1 = [
    { id: 'atm', image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=200&fit=crop', title: 'ATM & Topup' },
    { id: 'minimarket', image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=200&fit=crop', title: 'Minimarket' },
];

const stackedItems2 = [
    { id: 'charging', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop', title: 'Charging HP' },
    { id: 'atk', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=200&fit=crop', title: 'Photocopy & ATK' },
];

// WFA content - Figma matching
const wfaContent = [
    { id: 1, image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop', title: 'Cafe Nyaman', subtitle: 'Free Wifi' },
    { id: 2, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', title: 'Co-working', subtitle: 'Space' },
    { id: 3, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop', title: 'Taman /', subtitle: 'Ruang Publik' },
    { id: 4, image: 'https://images.unsplash.com/photo-1529543544277-750ee00a0b68?w=400&h=300&fit=crop', title: 'Kulineran', subtitle: 'Aja Yuk!' },
];

// Favorite places - Figma matching
const favoritePlaces = [
    { id: 1, image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop', title: 'GBK (Gelora\nBung Karno)', distance: '300 m' },
    { id: 2, image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop', title: 'FX Sudirman', distance: '150 m' },
    { id: 3, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop', title: 'Plaza Senayan', distance: '700 m' },
    { id: 4, image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop', title: 'Senayan City', distance: '900 m' },
    { id: 5, image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop', title: 'Senayan Park', distance: '1.2 km' },
];

// Optimized Video/Image Banner Component
function StoryBanner({ story, onClick }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const videoRef = useRef(null);

    // Robust video detection: check extension OR data:video
    const isVideo = React.useMemo(() => {
        if (!story.image) return false;
        return story.image.match(/\.(mp4|webm|mov|m4v)$/i) ||
            story.image.includes('data:video');
    }, [story.image]);

    // Timeout safety
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoaded) setIsLoaded(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoaded]);

    const handleVideoLoad = () => {
        setIsLoaded(true);
        if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { });
            }
        }
    };

    return (
        <div
            onClick={onClick}
            className="w-[175px] h-[300px] rounded-[20px] overflow-hidden flex-shrink-0 cursor-pointer relative group bg-grey-200"
        >
            {/* Loading Skeleton */}
            {!isLoaded && !loadError && (
                <div className="absolute inset-0 bg-grey-300 animate-pulse z-10" />
            )}

            {isVideo ? (
                <video
                    ref={videoRef}
                    src={getAssetUrl(story.image)}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleVideoLoad}
                    onLoadedData={handleVideoLoad}
                    onError={(e) => {
                        console.error('Video load error for:', story.image, e);
                        setLoadError(true);
                        setIsLoaded(true);
                    }}
                />
            ) : (
                <img
                    src={getImageUrl(story.image, { w: 350, resize: 'fill' })}
                    alt={story.title}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        console.error('Image load error for:', story.image, e);
                        e.target.style.display = 'none';
                        setLoadError(true);
                        setIsLoaded(true);
                    }}
                />
            )}

            {/* Error State */}
            {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-grey-200 text-grey-500 p-4 text-center">
                    <span className="text-2xl mb-2">⚠️</span>
                </div>
            )}

            {/* Gradient overlay - Only show if not error */}
            {!loadError && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80 pointer-events-none" />
                    <div className="absolute bottom-[15px] left-[20px] right-[20px] pointer-events-none">
                        <p className="text-grey-200 font-bold text-[18px] capitalize leading-normal">{story.title}</p>
                        <p className="text-grey-200/80 text-[14px] capitalize">{story.subtitle}</p>
                    </div>
                </>
            )}
        </div>
    );
}

export default function Home({ vendors, onSelectVendor }) {
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStory, setSelectedStory] = useState(null);
    const [storyBanners, setStoryBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    // Fetch banners from settings API
    useEffect(() => {
        setBannersLoading(true);
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.homepage_banners) {
                    let banners = [];
                    if (Array.isArray(data.homepage_banners)) {
                        banners = data.homepage_banners;
                    } else if (data.homepage_banners.banners && Array.isArray(data.homepage_banners.banners)) {
                        banners = data.homepage_banners.banners;
                    }

                    if (banners.length > 0) {
                        const validBanners = banners.filter(b =>
                            b.image && b.image.trim() !== ''
                        );
                        setStoryBanners(validBanners);
                    }
                }
            })
            .catch(err => console.error("Failed to load settings", err))
            .finally(() => setBannersLoading(false));
    }, []);

    const safeVendors = Array.isArray(vendors) ? vendors : [];

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted && loading) {
                setSortedVendors(safeVendors);
                setLoading(false);
            }
        }, 5000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (!isMounted) return;
                    const { latitude, longitude } = position.coords;
                    sortVendors(latitude, longitude);
                    clearTimeout(timer);
                },
                (error) => {
                    if (!isMounted) return;
                    setSortedVendors(safeVendors);
                    setLoading(false);
                    clearTimeout(timer);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setSortedVendors(safeVendors);
            setLoading(false);
            clearTimeout(timer);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [vendors]);

    const sortVendors = (lat, lng) => {
        if (!Array.isArray(vendors)) return;
        const sorted = [...vendors].map(v => {
            if (!v.location || !v.location.lat || !v.location.lng) {
                return { ...v, distance: null };
            }
            return {
                ...v,
                distance: calculateDistance(lat, lng, v.location.lat, v.location.lng)
            };
        }).sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
        setSortedVendors(sorted);
        setLoading(false);
    };

    const filteredVendors = sortedVendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    const handleNextStory = () => {
        if (!selectedStory || storyBanners.length === 0) return;
        const currentIndex = storyBanners.findIndex(s => s.id === selectedStory.id);
        if (currentIndex < storyBanners.length - 1) {
            setSelectedStory(storyBanners[currentIndex + 1]);
        } else {
            setSelectedStory(null);
        }
    };

    const handlePrevStory = () => {
        if (!selectedStory || storyBanners.length === 0) return;
        const currentIndex = storyBanners.findIndex(s => s.id === selectedStory.id);
        if (currentIndex > 0) {
            setSelectedStory(storyBanners[currentIndex - 1]);
        }
    };

    return (
        <AppLayout
            activeCategory="rekomen"
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Story Banners */}
            <div className="overflow-x-auto no-scrollbar pt-[10px] px-[10px]">
                <div className="flex gap-[5px] pr-[10px]">
                    {/* Loading Skeleton */}
                    {bannersLoading && [1, 2, 3].map((i) => (
                        <div
                            key={`loading-${i}`}
                            className="w-[175px] h-[300px] rounded-[20px] bg-grey-200 flex-shrink-0 animate-pulse"
                        />
                    ))}

                    {/* Actual Banners from Database */}
                    {!bannersLoading && storyBanners.map((story) => (
                        <StoryBanner
                            key={story.id}
                            story={story}
                            onClick={() => setSelectedStory(story)}
                        />
                    ))}

                    {/* Empty State */}
                    {!bannersLoading && storyBanners.length === 0 && (
                        <div className="w-full py-8 text-center text-grey-400">
                            <p className="text-sm">Belum ada banner story.</p>
                            <p className="text-xs">Kelola di Admin Dashboard → Settings</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transport Links Section */}
            <TransportLinks />

            {/* Quick Access Section */}
            <ContentSection title="Butuh Cepat Dan Dekat">
                {quickAccessContent.map((item) => (
                    <ContentCard
                        key={item.id}
                        image={item.image}
                        title={item.title}
                        subtitle={item.subtitle}
                        size="medium"
                    />
                ))}
                <StackedCards items={stackedItems1} />
                <StackedCards items={stackedItems2} />
            </ContentSection>

            {/* WFA Section */}
            <ContentSection title="Nunggu Sekalian WFA">
                {wfaContent.map((item) => (
                    <ContentCard
                        key={item.id}
                        image={item.image}
                        title={item.title}
                        subtitle={item.subtitle}
                        size="large"
                    />
                ))}
            </ContentSection>

            {/* Favorite Places Section */}
            <ContentSection title="Tempat Favorit">
                {favoritePlaces.map((item) => (
                    <FavoriteCard
                        key={item.id}
                        image={item.image}
                        title={item.title}
                        distance={item.distance}
                    />
                ))}
            </ContentSection>

            {/* Vendor List or Search Results */}
            {searchQuery && (
                <ContentSection title={`Hasil Pencarian "${searchQuery}"`}>
                    {filteredVendors.length > 0 ? (
                        filteredVendors.map(vendor => (
                            <div
                                key={vendor.id}
                                onClick={() => onSelectVendor(vendor)}
                                className="w-48 flex-shrink-0 bg-white p-3 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="w-full h-24 bg-grey-100 rounded-lg mb-2 overflow-hidden">
                                    {vendor.image ? (
                                        <img src={getImageUrl(vendor.image, { w: 200, resize: 'fit' })} alt={vendor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                                    )}
                                </div>
                                <h4 className="font-bold text-sm text-black truncate">{vendor.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-grey-600">
                                    <MapPin size={12} />
                                    <span className="truncate">{vendor.address}</span>
                                </div>
                                {vendor.distance && (
                                    <p className="text-xs font-bold text-primary mt-1">{vendor.distance.toFixed(1)} km</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="w-full py-8 text-center text-grey-600">
                            Tidak ada hasil ditemukan
                        </div>
                    )}
                </ContentSection>
            )}

            {/* Bottom Padding */}
            <div className="h-24" />

            {/* Story Modal */}
            <StoryModal
                isOpen={!!selectedStory}
                onClose={() => setSelectedStory(null)}
                story={selectedStory}
                onNext={handleNextStory}
                onPrev={handlePrevStory}
            />
        </AppLayout>
    );
}
