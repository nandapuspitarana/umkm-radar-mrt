import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { getImageUrl } from '../utils/api';
import { useStationSort } from '../hooks/useStationSort';

const ngopiCategories = [
    'Semua Kategori',
    'Coffee Shop',
    'Kopi Lokal',
    'Franchise',
    'Specialty Coffee',
];

const NGOPI_FILTER = (v) =>
    v.category?.toLowerCase().includes('ngopi') ||
    v.category?.toLowerCase().includes('coffee') ||
    v.category?.toLowerCase().includes('kopi') ||
    v.category?.toLowerCase().includes('cafe');

export default function Ngopi({ vendors, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [ngopiBanners, setNgopiBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    // ⚡ Instant station-based sort — no GPS delay
    const { sortedVendors, loading, stationCategory } = useStationSort(vendors, NGOPI_FILTER);

    // Fetch ngopi banners (run once)
    React.useEffect(() => {
        let cancelled = false;
        setBannersLoading(true);
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (!cancelled && data.ngopi_banners && Array.isArray(data.ngopi_banners)) {
                    setNgopiBanners(data.ngopi_banners);
                }
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setBannersLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Filter by search
    const filteredVendors = sortedVendors.filter(v => {
        const q = searchQuery.toLowerCase();
        return v.name.toLowerCase().includes(q) || (v.address || '').toLowerCase().includes(q);
    });

    const handleBannerClick = (banner) => {
        if (!banner.link) return;
        if (banner.link.startsWith('http')) window.open(banner.link, '_blank');
        else navigate(banner.link);
    };

    return (
        <AppLayout
            activeCategory="ngopi"
            title="Ngopi"
            subtitle={stationCategory}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Category Filter */}
            <div className="sticky top-0 z-10 bg-grey-100 p-2.5">
                <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-white border border-grey-300 rounded-full py-2.5 px-4 flex items-center justify-between hover:bg-grey-100 transition-colors"
                >
                    <span className="text-grey-600 text-sm">{selectedCategory}</span>
                    <ChevronDown size={18} className={`text-grey-600 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isCategoryOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-2.5 right-2.5 mt-1 bg-white rounded-2xl shadow-lg border border-grey-200 overflow-hidden z-20"
                        >
                            {ngopiCategories.map(cat => (
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



            {/* Ngopi Banners */}
            {(bannersLoading || ngopiBanners.length > 0) && (
                <div className="overflow-x-auto no-scrollbar px-2.5">
                    <div className="flex gap-1.5 pb-2.5">
                        {bannersLoading && [1, 2, 3].map(i => (
                            <div key={i} className="w-48 h-48 rounded-2xl bg-grey-200 flex-shrink-0 animate-pulse" />
                        ))}
                        {!bannersLoading && ngopiBanners.map(banner => (
                            <div
                                key={banner.id}
                                onClick={() => handleBannerClick(banner)}
                                className={`w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0 relative group ${banner.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                            >
                                {banner.image && (
                                    <img src={banner.image} alt={banner.title || 'Ngopi'} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={e => e.target.style.display = 'none'} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                {banner.title && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="bg-white/90 px-3 py-1.5 rounded-lg">
                                            <span className="text-sm font-semibold text-grey-800">{banner.title}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vendor List */}
            <div className="flex flex-col gap-2.5 px-2.5 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-grey-600">
                        <span className="text-4xl mb-3">☕</span>
                        <p className="font-semibold">Belum ada kedai kopi</p>
                        <p className="text-sm">Coba ubah filter atau cari yang lain</p>
                    </div>
                ) : (
                    filteredVendors.map(vendor => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            onClick={() => onSelectVendor && onSelectVendor(vendor)}
                        />
                    ))
                )}
            </div>
        </AppLayout>
    );
}

function VendorCard({ vendor, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-grey-200 rounded-2xl p-1.5 flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow relative"
        >
            {/* Thumbnail */}
            <div className="w-14 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-grey-100">
                {vendor.image ? (
                    <img src={getImageUrl(vendor.image, { w: 100, h: 100, resize: 'crop' })} alt={vendor.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
                <h3 className="font-semibold text-sm text-gray-700 truncate capitalize">{vendor.name}</h3>
                <p className="text-xs text-highlight-blue truncate mt-1">{vendor.address || 'Alamat tidak tersedia'}</p>
                <p className="text-sm font-semibold text-grey-500 mt-1">
                    {vendor.schedule?.open || '08:00'} - {vendor.schedule?.close || '21:00'}
                </p>
            </div>
        </div>
    );
}
