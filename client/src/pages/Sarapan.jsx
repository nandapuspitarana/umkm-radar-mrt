import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorCard from '../components/VendorCard';
import { useStationSort } from '../hooks/useStationSort';
import { getImageUrl } from '../utils/api';

const DEFAULT_CATEGORIES = [
    'Semua Kategori',
    'Makanan Berat',
    'Snack & Roti',
    'Minuman & Kopi',
    'Convenience Store',
];

export default function Sarapan({ vendors, preSorted = false, onSelectVendor }) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    
    // Determine slug dynamically. If we are on /sarapan it's "sarapan", otherwise it's from params.slug
    const slug = location.pathname.includes('/sarapan') ? 'sarapan' : (params.slug || 'sarapan');

    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Page config states
    const [pageConfig, setPageConfig] = useState(null);
    const [pageBanners, setPageBanners] = useState([]);
    const [configLoading, setConfigLoading] = useState(true);

    // Initial sort (on all vendors)
    const { sortedVendors, loading: sortingLoading, stationCategory } = useStationSort(
        vendors,
        null, // no direct pre-filter, we filter dynamically after sorting
        preSorted
    );

    // Fetch dynamic config
    useEffect(() => {
        let cancelled = false;
        setConfigLoading(true);

        const applyConfig = (data) => {
            const qaBanners = data.quick_access_banners || [];
            // Find matched banner config by slug
            const matched = qaBanners.find(b => b.isDynamicSubpage && b.slug === slug);

            if (matched) {
                setPageConfig(matched);
                if (matched.bannerSource) {
                    const raw = data[matched.bannerSource] || [];
                    let extracted = [];
                    if (Array.isArray(raw)) extracted = raw;
                    else if (raw.banners && Array.isArray(raw.banners)) extracted = raw.banners;
                    setPageBanners(extracted);
                } else {
                    setPageBanners([]);
                }
            } else {
                // Fallback to default Sarapan styling
                setPageConfig({
                    title: 'REKOMENDASI SARAPAN',
                    vendorFilter: 'sarapan, nasi uduk, bubur, lontong, convenience, kopi, roti, mart'
                });
                // Default banners
                const raw = data.sarapan_banners || data.kuliner_banners || [];
                let extracted = [];
                if (Array.isArray(raw)) extracted = raw;
                else if (raw.banners && Array.isArray(raw.banners)) extracted = raw.banners;
                setPageBanners(extracted);
            }
            setConfigLoading(false);
        };

        fetch('/api/settings', { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(data => {
                if (!cancelled) {
                    // Cache the latest settings in background
                    try {
                        localStorage.setItem('umkm_settings_cache', JSON.stringify(data));
                    } catch (e) {}
                    applyConfig(data);
                }
            })
            .catch(err => {
                console.error('Failed to load subpage config:', err);
                if (!cancelled) {
                    // Try to fallback to cached settings if fetch failed
                    try {
                        const cached = localStorage.getItem('umkm_settings_cache');
                        if (cached) applyConfig(JSON.parse(cached));
                        else setConfigLoading(false); // Can't do much
                    } catch (e) {
                        setConfigLoading(false);
                    }
                }
            });

        return () => { cancelled = true; };
    }, [slug]);

    // Derived filtered vendors
    const filteredVendors = React.useMemo(() => {
        if (!sortedVendors) return [];
        if (!pageConfig) return [];
        if (pageConfig.isError) return [];

        // 1. Config Filter Keyword (mitra/vendor filter)
        let configKeywords = [];
        if (pageConfig.vendorFilter) {
            configKeywords = pageConfig.vendorFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        }

        return sortedVendors.filter(v => {
            const vText = `${v.name} ${v.category} ${v.tags} ${v.description} ${v.locationTags}`.toLowerCase();

            // Match Config Filter
            let matchConfig = false;
            if (configKeywords.length === 0) {
                matchConfig = true; // No filter specified, show all
            } else {
                matchConfig = configKeywords.some(kw => vText.includes(kw));
            }

            if (!matchConfig) return false;

            // 2. Search Box Match
            const q = searchQuery.toLowerCase();
            const matchSearch = v.name.toLowerCase().includes(q) || (v.address || '').toLowerCase().includes(q);
            if (!matchSearch) return false;

            // 3. Category Dropdown Match
            let matchCat = true;
            if (selectedCategory !== 'Semua Kategori') {
                const catLower = selectedCategory.toLowerCase();
                if (catLower === 'makanan berat') matchCat = vText.includes('nasi') || vText.includes('mie') || vText.includes('lontong');
                else if (catLower === 'snack & roti') matchCat = vText.includes('roti') || vText.includes('kue') || vText.includes('snack');
                else if (catLower === 'minuman & kopi') matchCat = vText.includes('kopi') || vText.includes('minuman') || vText.includes('es');
                else if (catLower === 'convenience store') matchCat = vText.includes('mart') || vText.includes('lawson') || vText.includes('indomaret');
                else matchCat = vText.includes(catLower);
            }

            return matchCat;
        });
    }, [sortedVendors, pageConfig, selectedCategory, searchQuery]);

    const handleBannerClick = (banner) => {
        if (!banner.link) return;
        if (banner.link.startsWith('http')) window.open(banner.link, '_blank');
        else navigate(banner.link);
    };

    if (configLoading || sortingLoading) {
        return (
            <div className="min-h-screen bg-grey-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }



    const titlePrefix = pageConfig?.subpageTitle || pageConfig?.title || 'HALAMAN KHUSUS';

    return (
        <div className="min-h-screen bg-grey-100 flex flex-col relative w-full">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-[25px] shadow-sm pb-[10px]">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between h-[64px] py-[10px] px-[17px]">
                        <button
                            onClick={() => navigate('/')}
                            className="w-8 h-8 flex items-center justify-center -ml-2 rounded-full hover:bg-grey-100 transition-colors"
                        >
                            <ChevronLeft size={24} className="text-black" />
                        </button>
                        <div className="flex-1 flex flex-col items-center">
                            <h1 className="font-black text-[15px] text-[#242424] tracking-[0.225px] uppercase">
                                {titlePrefix}
                            </h1>
                            <p className="font-semibold text-[13px] text-highlight-blue tracking-[-0.05px] lowercase mt-[2px]">
                                {stationCategory || 'senayan mastercard'}
                            </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center">
                        </div>
                    </div>
                    
                    <div className="px-[20px] w-full">
                        <button
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="w-full bg-white border border-[#979797] border-solid rounded-[50px] h-[40px] px-[15px] pr-[10px] flex items-center justify-between gap-[20px] hover:bg-grey-100 transition-colors"
                        >
                            <span className="text-grey-600 text-[16px] font-normal">{selectedCategory}</span>
                            <ChevronDown size={24} className={`text-grey-600 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isCategoryOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-[20px] right-[20px] mt-1 bg-white rounded-[20px] shadow-lg border border-grey-200 overflow-hidden z-20"
                                >
                                    {DEFAULT_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                            className={`w-full text-left px-4 py-3 hover:bg-grey-100 transition-colors text-sm ${selectedCategory === cat ? 'bg-grey-100 text-primary font-semibold' : 'text-grey-600'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-[20px]">
                {!searchQuery && pageBanners.length > 0 && (
                    <div className="sticky top-0 z-[2] bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent p-[10px] w-full max-w-[100vw]">
                        <div className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-[5px] pr-[10px]">
                                {pageBanners.map(banner => (
                                    <div
                                        key={banner.id || banner.image}
                                        onClick={() => handleBannerClick(banner)}
                                        className={`w-[200px] h-[200px] rounded-[20px] overflow-hidden flex-shrink-0 relative group ${banner.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                                    >
                                        {banner.image && (
                                            <img src={getImageUrl(banner.image, { w: 400, resize: 'fill' })} alt={banner.title || 'Banner'} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={e => e.target.style.display = 'none'} />
                                        )}

                                        {banner.title && (
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
                                                    <span className="text-sm font-semibold text-grey-700">{banner.title}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-[10px] px-[10px] pt-[5px] z-[1] relative mt-2">
                    {filteredVendors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-grey-600 bg-white rounded-[20px] border border-grey-200 mt-2">
                            <span className="text-4xl mb-3">🔍</span>
                            <p className="font-semibold text-center px-4">Belum ada pilihan vendor tersedia</p>
                            <p className="text-sm text-center px-4 mt-2">Coba ubah kategori, periksa ketersediaan toko di stasiun ini, atau cek filter konfigurasi dashboard admin.</p>
                        </div>
                    ) : (
                        filteredVendors.map(vendor => (
                            <VendorCard
                                key={vendor.id}
                                vendor={vendor}
                                fallbackEmoji="✨"
                                onClick={() => onSelectVendor && onSelectVendor(vendor)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
