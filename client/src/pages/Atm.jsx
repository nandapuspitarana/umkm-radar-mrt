import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import VendorCard from '../components/VendorCard';
import { useStationSort } from '../hooks/useStationSort';

const atmCategories = [
    'Semua Kategori',
    'ATM',
    'Minimarket',
    'Supermarket',
    'Department Store',
];

const ATM_FILTER = (v) =>
    v.category?.toLowerCase().includes('atm') ||
    v.category?.toLowerCase().includes('minimarket') ||
    v.category?.toLowerCase().includes('supermarket') ||
    v.category?.toLowerCase().includes('convenience') ||
    v.category?.toLowerCase().includes('belanja') ||
    v.category?.toLowerCase().includes('store');

export default function Atm({ vendors, preSorted = false, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [atmBanners, setAtmBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    const { sortedVendors, loading, stationCategory } = useStationSort(
        vendors,
        preSorted ? null : ATM_FILTER,
        preSorted
    );

    React.useEffect(() => {
        let cancelled = false;

        // Try local cache first
        const cachedSettings = localStorage.getItem('umkm_settings_cache');
        if (cachedSettings) {
            try {
                const parsed = JSON.parse(cachedSettings);
                if (parsed.atm_banners) {
                    const raw = Array.isArray(parsed.atm_banners) ? parsed.atm_banners
                        : (parsed.atm_banners.banners || []);
                    setAtmBanners(raw.filter(b => b.image?.trim()));
                    setBannersLoading(false);
                }
            } catch (e) { }
        } else {
            setBannersLoading(true);
        }

        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (!cancelled) {
                    if (data.atm_banners) {
                        const raw = Array.isArray(data.atm_banners) ? data.atm_banners
                            : (data.atm_banners.banners || []);
                        setAtmBanners(raw.filter(b => b.image?.trim()));
                    }
                    setBannersLoading(false);
                    try { localStorage.setItem('umkm_settings_cache', JSON.stringify(data)); } catch (e) { }
                }
            })
            .catch(err => {
                console.error(err);
                if (!cancelled) setBannersLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

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
            activeCategory="atm"
            title="ATM & Minimarket"
            subtitle={stationCategory}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Sticky top: banners + category filter */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent p-[10px]">
                {/* Banners */}
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-[5px]">
                        {bannersLoading && [1, 2, 3, 4].map(i => (
                            <div key={i} className="w-[200px] h-[200px] rounded-[20px] bg-grey-200 flex-shrink-0 animate-pulse" />
                        ))}
                        {!bannersLoading && atmBanners.map(banner => (
                            <div
                                key={banner.id}
                                onClick={() => handleBannerClick(banner)}
                                className={`w-[200px] h-[200px] rounded-[20px] overflow-hidden flex-shrink-0 relative group bg-white shadow-sm ${banner.link ? 'cursor-pointer hover:shadow-md' : ''}`}
                            >
                                <img src={banner.image} className="absolute inset-0 w-full h-full object-cover" alt={banner.title || 'ATM'} onError={e => e.target.style.display = 'none'} />
                                {banner.title && (
                                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                                        <div className="bg-grey-100/90 px-2 py-0.5 rounded-lg">
                                            <span className="text-[10px] font-semibold text-grey-700">{banner.title}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {!bannersLoading && atmBanners.length === 0 && (
                            <div className="w-full py-3 text-center text-grey-400">
                                <p className="text-xs">Belum ada banner ATM</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mt-2">
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
                                {atmCategories.map(cat => (
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

            {/* Vendor List */}
            <div className="flex flex-col gap-[10px] px-[10px] pb-[20px] mt-[15px]">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-grey-600">
                        <span className="text-4xl mb-3">🏪</span>
                        <p className="font-semibold">Belum ada toko</p>
                        <p className="text-sm">Coba ubah filter atau cari yang lain</p>
                    </div>
                ) : (
                    filteredVendors.map(vendor => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            fallbackEmoji="🏪"
                            onClick={() => onSelectVendor && onSelectVendor(vendor)}
                        />
                    ))
                )}
            </div>
        </AppLayout>
    );
}
