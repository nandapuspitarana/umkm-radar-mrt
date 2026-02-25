import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import VendorCard from '../components/VendorCard';
import { useStationSort } from '../hooks/useStationSort';

const kulinerCategories = [
    'Semua Kategori',
    'Nasi & Lontong',
    'Mie & Bakmi',
    'Bubur',
    'Warung Padang',
    'Convenience Store',
];

const KULINER_FILTER = (v) =>
    v.category?.toLowerCase().includes('kuliner') ||
    v.category?.toLowerCase().includes('makanan') ||
    v.category?.toLowerCase().includes('food') ||
    v.category?.toLowerCase().includes('restaurant') ||
    v.category?.toLowerCase().includes('warung') ||
    v.category?.toLowerCase().includes('convenience');

/**
 * Kuliner page
 * @param {object[]} vendors   - Pre-sorted vendor list (dari /api/vendors/grouped.kuliner)
 * @param {boolean}  preSorted - true = data sudah sorted oleh backend
 * @param {function} onSelectVendor
 */
export default function Kuliner({ vendors, preSorted = false, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [kulinerBanners, setKulinerBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    const { sortedVendors, loading, stationCategory } = useStationSort(
        vendors,
        preSorted ? null : KULINER_FILTER,
        preSorted
    );

    // Fetch banners (run once)
    React.useEffect(() => {
        let cancelled = false;

        // Try local cache first for instant load
        const cachedSettings = localStorage.getItem('umkm_settings_cache');
        if (cachedSettings) {
            try {
                const parsed = JSON.parse(cachedSettings);
                if (parsed.kuliner_banners && Array.isArray(parsed.kuliner_banners)) {
                    setKulinerBanners(parsed.kuliner_banners);
                    setBannersLoading(false); // Instant load
                }
            } catch (e) { }
        } else {
            setBannersLoading(true);
        }

        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (!cancelled) {
                    if (data.kuliner_banners && Array.isArray(data.kuliner_banners)) {
                        setKulinerBanners(data.kuliner_banners);
                    }
                    setBannersLoading(false);
                    // Update cache silently
                    try { localStorage.setItem('umkm_settings_cache', JSON.stringify(data)); } catch (e) { }
                }
            })
            .catch(err => {
                console.error('Settings load error:', err);
                if (!cancelled) setBannersLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    // Filter by search + category
    const filteredVendors = sortedVendors.filter(v => {
        const q = searchQuery.toLowerCase();
        const matchSearch = v.name.toLowerCase().includes(q) || (v.address || '').toLowerCase().includes(q);
        const matchCat = selectedCategory === 'Semua Kategori' || v.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const handleBannerClick = (banner) => {
        if (!banner.link) return;
        if (banner.link.startsWith('http')) window.open(banner.link, '_blank');
        else navigate(banner.link);
    };

    return (
        <AppLayout
            activeCategory="kuliner"
            title="Kulineran"
            subtitle={stationCategory}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Category Filter */}
            <div className="sticky top-0 z-10 bg-grey-100 p-[10px]">
                <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-white border border-grey-300 rounded-full h-[40px] px-[15px] pr-[10px] flex items-center justify-between gap-[20px] hover:bg-grey-100 transition-colors"
                    style={{ borderColor: '#979797' }}
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
                            className="absolute left-[10px] right-[10px] mt-1 bg-white rounded-[20px] shadow-lg border border-grey-200 overflow-hidden z-20"
                        >
                            {kulinerCategories.map(cat => (
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

            {/* Banners */}
            {(bannersLoading || kulinerBanners.length > 0) && (
                <div className="bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent px-[10px]">
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="flex gap-[5px] pr-[10px]">
                            {bannersLoading && [1, 2, 3].map(i => (
                                <div key={i} className="w-[200px] h-[200px] rounded-[20px] bg-grey-200 flex-shrink-0 animate-pulse" />
                            ))}
                            {!bannersLoading && kulinerBanners.map(banner => (
                                <div
                                    key={banner.id}
                                    onClick={() => handleBannerClick(banner)}
                                    className={`w-[200px] h-[200px] rounded-[20px] overflow-hidden flex-shrink-0 relative group ${banner.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                                >
                                    {banner.image && (
                                        <img src={banner.image} alt={banner.title || 'Kuliner'} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={e => e.target.style.display = 'none'} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    {banner.title && (
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="bg-white/90 px-3 py-1.5 rounded-lg">
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

            {/* Vendor List */}
            <div className="flex flex-col gap-[10px] px-[10px] pb-[20px] mt-[15px]">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-grey-600">
                        <span className="text-4xl mb-3">🍽️</span>
                        <p className="font-semibold">Belum ada warung makan</p>
                        <p className="text-sm">Coba ubah filter atau cari yang lain</p>
                    </div>
                ) : (
                    filteredVendors.map(vendor => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            fallbackEmoji="🍽️"
                            onClick={() => onSelectVendor && onSelectVendor(vendor)}
                        />
                    ))
                )}
            </div>
        </AppLayout>
    );
}
