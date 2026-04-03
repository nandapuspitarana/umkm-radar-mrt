import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { getImageUrl, getAssetUrl } from '../utils/api';
import AppLayout from '../components/AppLayout';
import TransportLinks from '../components/TransportLinks';
import ContentSection, { ContentCard, FavoriteCard, StackedCards } from '../components/ContentSection';
import StoryModal from '../components/StoryModal';

// Fallback static data jika API belum memiliki data
const FALLBACK_QUICK_ACCESS = [
    { id: 1, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=400&fit=crop', title: 'Buat yang', subtitle: 'Belum Sarapan', link: '/sub-page/sarapan', type: 'medium', isDynamicSubpage: true, slug: 'sarapan', subpageTitle: 'Rekomendasi Sarapan', vendorFilter: 'sarapan, nasi uduk, bubur, lontong' },
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

const FALLBACK_REKOMEN = [
    { id: 1, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', title: 'Kuliner Hits', subtitle: 'Sekitar Stasiun', link: '/kuliner' },
    { id: 2, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', title: 'Ngopi Santai', subtitle: 'Sambil Nunggu', link: '/ngopi' },
    { id: 3, image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop', title: 'Wisata Dekat', subtitle: 'MRT Terdekat', link: '/wisata' },
    { id: 4, image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop', title: 'Tempat Publik', subtitle: 'Fasilitas Umum', link: '/publik' },
];

// Favorite places - Figma matching
const favoritePlaces = [
    { id: 1, image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop', title: 'GBK (Gelora\nBung Karno)', distance: '300 m' },
    { id: 2, image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop', title: 'FX Sudirman', distance: '150 m' },
    { id: 3, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop', title: 'Plaza Blok M', distance: '700 m' },
    { id: 4, image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop', title: 'Blok M Square', distance: '900 m' },
    { id: 5, image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop', title: 'Taman Literasi Blok M', distance: '1.2 km' },
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
                    src={getAssetUrl(story.image) + '#t=0.001'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                    onLoadedMetadata={() => setIsLoaded(true)}
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
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-[15px] left-[15px] right-[15px] pointer-events-none z-30">
                <p className="text-white font-bold text-[16px] capitalize leading-tight drop-shadow-md pb-1">{story.title}</p>
                {story.subtitle && (
                    <p className="text-grey-300 text-[12px] capitalize drop-shadow-md font-medium">{story.subtitle}</p>
                )}
            </div>
        </div>
    );
}

export default function Home({ vendors, onSelectVendor, stationCategory = 'Blok M', onStationChange }) {
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStory, setSelectedStory] = useState(null);
    const [storyBanners, setStoryBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);
    const [quickAccessItems, setQuickAccessItems] = useState(FALLBACK_QUICK_ACCESS);
    const [wfaItems, setWfaItems] = useState(FALLBACK_WFA);
    const [favoritePlacesItems, setFavoritePlacesItems] = useState(favoritePlaces);
    const [rekomenItems, setRekomenItems] = useState(FALLBACK_REKOMEN);

    // Fetch banners from settings API
    useEffect(() => {
        setBannersLoading(true);
        fetch('/api/settings', {
            // Hint browser to cache response; server also sends Cache-Control
            headers: { 'Accept': 'application/json' },
        })
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
                    if (validBanners.length > 0) {
                        setStoryBanners(validBanners);
                        // Preload the first banner image so it appears instantly
                        const firstImg = validBanners[0];
                        if (firstImg && firstImg.image && !firstImg.image.match(/\.(mp4|webm|mov|m4v)$/i)) {
                            const link = document.createElement('link');
                            link.rel = 'preload';
                            link.as = 'image';
                            link.href = getImageUrl(firstImg.image, { w: 350, resize: 'fill' });
                            link.fetchPriority = 'high';
                            document.head.appendChild(link);
                        }
                    }
                }
                // Quick access banners
                if (data.quick_access_banners && Array.isArray(data.quick_access_banners) && data.quick_access_banners.length > 0) {
                    setQuickAccessItems(data.quick_access_banners);
                }
                // WFA banners
                if (data.wfa_banners && Array.isArray(data.wfa_banners) && data.wfa_banners.length > 0) {
                    setWfaItems(data.wfa_banners);
                }
                // Favorite places
                if (data.favorite_places && Array.isArray(data.favorite_places) && data.favorite_places.length > 0) {
                    setFavoritePlacesItems(data.favorite_places);
                }
                // Rekomendasi lainnya
                if (data.rekomen_banners && Array.isArray(data.rekomen_banners) && data.rekomen_banners.length > 0) {
                    setRekomenItems(data.rekomen_banners);
                }
            })
            .catch(err => console.error("Failed to load settings", err))
            .finally(() => setBannersLoading(false));
    }, []);

    const safeVendors = Array.isArray(vendors) ? vendors : [];

    // Sort vendors by station category — INSTANT, no GPS needed
    useEffect(() => {
        if (safeVendors.length === 0) return;

        const stationLower = stationCategory.toLowerCase();

        const sorted = [...safeVendors].sort((a, b) => {
            const aMatch = (a.locationTags || a.location_tags || '').toLowerCase().includes(stationLower);
            const bMatch = (b.locationTags || b.location_tags || '').toLowerCase().includes(stationLower);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        setSortedVendors(sorted);
        setLoading(false);
    }, [vendors, stationCategory]);

    // Filter vendor berdasar search
    const filteredVendors = sortedVendors.filter(v => {
        const search = searchQuery.toLowerCase();
        return v.name.toLowerCase().includes(search) ||
            (v.address || '').toLowerCase().includes(search);
    });

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
            title={stationCategory}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Jika sedang mencari, tampilkan HANYA hasil pencarian */}
            {searchQuery ? (
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
                                        <img
                                            src={getImageUrl(vendor.image, { w: 200, resize: 'fit' })}
                                            alt={vendor.name}
                                            className="w-full h-full object-cover"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                                    )}
                                </div>
                                <h4 className="font-bold text-sm text-black truncate">{vendor.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-grey-600">
                                    <MapPin size={12} />
                                    <span className="truncate">{vendor.address}</span>
                                </div>
                                {vendor.locationTags && (
                                    <p className="text-xs text-grey-400 mt-1 truncate">{vendor.locationTags}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="w-full py-8 text-center text-grey-600">
                            Tidak ada hasil ditemukan
                        </div>
                    )}
                </ContentSection>
            ) : (
                <>
                    {/* Story Banners */}
                    <div className="overflow-x-auto no-scrollbar pt-2.5 px-2.5 pb-1.5">
                        <div className="flex gap-1.5 pr-2.5">
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

                            {/* Extra spacer to ensure the last item is not stuck to the right edge */}
                            <div className="w-1 flex-shrink-0" />
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
                                            image={item.image && (item.image.includes('images.unsplash.com') ? item.image : getImageUrl(item.image, { w: 400, resize: 'fill' }))}
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
                                                items={items.map(i => ({...i, image: i.image && (i.image.includes('images.unsplash.com') ? i.image : getImageUrl(i.image, { w: 400, resize: 'fill' }))}))}
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
                        {favoritePlacesItems.map((item) => (
                            <FavoriteCard
                                key={item.id}
                                image={item.image && (item.image.includes('images.unsplash.com') ? item.image : getImageUrl(item.image, { w: 400, resize: 'fill' }))}
                                title={item.title}
                                distance={item.distance}
                                onClick={() => item.link && (window.location.href = item.link)}
                            />
                        ))}
                    </ContentSection>

                    {/* Rekomendasi Lainnya Section */}
                    <ContentSection title="Rekomendasi Lainnya">
                        {rekomenItems.map((item) => (
                            <ContentCard
                                key={item.id}
                                image={item.image}
                                title={item.title}
                                subtitle={item.subtitle}
                                size="small"
                                onClick={() => item.link && (window.location.href = item.link)}
                            />
                        ))}
                    </ContentSection>
                </>
            )}

            {/* Bottom Padding */}
            <div className="h-4" />

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
