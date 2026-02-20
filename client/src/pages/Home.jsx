import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { getImageUrl, getAssetUrl } from '../utils/api';
import AppLayout from '../components/AppLayout';
import TransportLinks from '../components/TransportLinks';
import ContentSection, { ContentCard, FavoriteCard, StackedCards } from '../components/ContentSection';
import StoryModal from '../components/StoryModal';

// Fallback static data jika API belum memiliki data
const FALLBACK_QUICK_ACCESS = [
    { id: 1, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=400&fit=crop', title: 'Buat yang', subtitle: 'Belum Sarapan', link: '', type: 'medium' },
    { id: 2, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', title: 'Butuh Ngopi', subtitle: 'Takeaway', link: '', type: 'medium' },
    { id: 3, image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=400&fit=crop', title: 'Parkir Seharian', subtitle: 'Tarif Flat', link: '', type: 'medium' },
    { id: 4, image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&h=400&fit=crop', title: 'Masjid/', subtitle: 'Mushala', link: '', type: 'medium' },
    { id: 5, image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=200&fit=crop', title: 'ATM & Topup', subtitle: '', link: '', type: 'stacked', group: 1 },
    { id: 6, image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=200&fit=crop', title: 'Minimarket', subtitle: '', link: '', type: 'stacked', group: 1 },
    { id: 7, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop', title: 'Charging HP', subtitle: '', link: '', type: 'stacked', group: 2 },
    { id: 8, image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=200&fit=crop', title: 'Photocopy & ATK', subtitle: '', link: '', type: 'stacked', group: 2 },
];

const FALLBACK_WFA = [
    { id: 1, image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop', title: 'Cafe Nyaman', subtitle: 'Free Wifi', link: '' },
    { id: 2, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', title: 'Co-working', subtitle: 'Space', link: '' },
    { id: 3, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop', title: 'Taman /', subtitle: 'Ruang Publik', link: '' },
    { id: 4, image: 'https://images.unsplash.com/photo-1529543544277-750ee00a0b68?w=400&h=300&fit=crop', title: 'Kulineran', subtitle: 'Aja Yuk!', link: '' },
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

    return (
        <div
            onClick={onClick}
            className="w-[175px] h-[300px] rounded-[20px] overflow-hidden flex-shrink-0 cursor-pointer relative group bg-black shadow-lg"
        >
            {/* Loading Skeleton - Dark Mode */}
            {!isLoaded && !loadError && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse z-0" />
            )}

            {isVideo ? (
                <video
                    ref={videoRef}
                    src={getAssetUrl(story.image)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    autoPlay
                    onLoadedData={() => setIsLoaded(true)}
                    onError={(e) => {
                        console.error('Video thumbnail error:', story.image, e);
                        setLoadError(true);
                        setIsLoaded(true);
                    }}
                />
            ) : (
                <img
                    src={getImageUrl(story.image, { w: 350, resize: 'fill' })}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        console.error('Image load error for:', story.image, e);
                        setLoadError(true);
                        setIsLoaded(true);
                    }}
                />
            )}

            {/* Error State */}
            {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-grey-500 p-4 text-center z-10">
                    <span className="text-2xl mb-2">⚠️</span>
                    <span className="text-xs text-grey-400">Gagal memuat</span>
                </div>
            )}

            {/* Gradient & Text Overlay - Always visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 pointer-events-none z-20" />
            <div className="absolute bottom-[15px] left-[15px] right-[15px] pointer-events-none z-30">
                <p className="text-white font-bold text-[16px] capitalize leading-tight drop-shadow-md pb-1">{story.title}</p>
                {story.subtitle && (
                    <p className="text-grey-300 text-[12px] capitalize drop-shadow-md font-medium">{story.subtitle}</p>
                )}
            </div>
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
    const [quickAccessItems, setQuickAccessItems] = useState(FALLBACK_QUICK_ACCESS);
    const [wfaItems, setWfaItems] = useState(FALLBACK_WFA);

    // Fetch banners from settings API
    useEffect(() => {
        setBannersLoading(true);
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                // Story banners
                if (data.homepage_banners) {
                    let banners = [];
                    if (Array.isArray(data.homepage_banners)) {
                        banners = data.homepage_banners;
                    } else if (data.homepage_banners.banners && Array.isArray(data.homepage_banners.banners)) {
                        banners = data.homepage_banners.banners;
                    }
                    const validBanners = banners.filter(b => b.image && b.image.trim() !== '');
                    if (validBanners.length > 0) setStoryBanners(validBanners);
                }
                // Quick access banners
                if (data.quick_access_banners && Array.isArray(data.quick_access_banners) && data.quick_access_banners.length > 0) {
                    setQuickAccessItems(data.quick_access_banners);
                }
                // WFA banners
                if (data.wfa_banners && Array.isArray(data.wfa_banners) && data.wfa_banners.length > 0) {
                    setWfaItems(data.wfa_banners);
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

            {/* Quick Access Section — data dari dashboard */}
            <ContentSection title="Butuh Cepat Dan Dekat">
                {(() => {
                    const mediumItems = quickAccessItems.filter(i => i.type !== 'stacked');
                    const stackedGroupsMap = {};
                    quickAccessItems.filter(i => i.type === 'stacked').forEach(i => {
                        const grp = i.group ?? 1;
                        if (!stackedGroupsMap[grp]) stackedGroupsMap[grp] = [];
                        stackedGroupsMap[grp].push(i);
                    });

                    return (
                        <>
                            {mediumItems.map((item) => (
                                <ContentCard
                                    key={item.id}
                                    image={item.image}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    size="medium"
                                    onClick={() => item.link && (window.location.href = item.link)}
                                />
                            ))}
                            {Object.entries(stackedGroupsMap)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([grp, items]) => (
                                    <StackedCards
                                        key={grp}
                                        items={items}
                                        onClick={(item) => item.link && (window.location.href = item.link)}
                                    />
                                ))
                            }
                        </>
                    );
                })()}
            </ContentSection>

            {/* WFA Section — data dari dashboard */}
            <ContentSection title="Nunggu Sekalian WFA">
                {wfaItems.map((item) => (
                    <ContentCard
                        key={item.id}
                        image={item.image}
                        title={item.title}
                        subtitle={item.subtitle}
                        size="large"
                        onClick={() => item.link && (window.location.href = item.link)}
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
                stories={storyBanners}
                currentIndex={selectedStory ? storyBanners.findIndex(s => s.id === selectedStory.id) : 0}
                onNext={handleNextStory}
                onPrev={handlePrevStory}
            />
        </AppLayout>
    );
}
