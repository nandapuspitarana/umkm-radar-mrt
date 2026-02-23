import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { getImageUrl } from '../utils/api';
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

export default function Atm({ vendors, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [atmBanners, setAtmBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    // ⚡ Instant station-based sort — no GPS delay
    const { sortedVendors, loading, stationCategory } = useStationSort(vendors, ATM_FILTER);

    React.useEffect(() => {
        let cancelled = false;
        setBannersLoading(true);
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (!cancelled && data.atm_banners) {
                    const raw = Array.isArray(data.atm_banners) ? data.atm_banners
                        : (data.atm_banners.banners || []);
                    setAtmBanners(raw.filter(b => b.image?.trim()));
                }
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setBannersLoading(false); });
        return () => { cancelled = true; };
    }, []);

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
            activeCategory="atm"
            title="ATM & Minimarket"
            subtitle={stationCategory}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* ATM Banners */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent p-2.5">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-1.5">
                        {bannersLoading && [1, 2, 3, 4].map(i => (
                            <div key={i} className="w-32 h-24 rounded-2xl bg-grey-200 flex-shrink-0 animate-pulse" />
                        ))}
                        {!bannersLoading && atmBanners.map(banner => (
                            <div
                                key={banner.id}
                                onClick={() => handleBannerClick(banner)}
                                className={`w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative group bg-white shadow-sm ${banner.link ? 'cursor-pointer hover:shadow-md' : ''}`}
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
            </div>



            {/* Vendor List */}
            <div className="flex flex-col gap-2.5 px-2.5 pb-24">
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

            <div className="w-14 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-grey-100">
                {vendor.image ? (
                    <img
                        src={getImageUrl(vendor.image, { w: 100, h: 100, resize: 'crop' })}
                        alt={vendor.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.style.setProperty('display', 'flex'); }}
                    />
                ) : null}
                <div
                    className="w-full h-full items-center justify-center text-2xl"
                    style={{ display: vendor.image ? 'none' : 'flex' }}
                >🏪</div>
            </div>

            <div className="flex-1 min-w-0 py-1 pr-6">
                <h3 className="font-semibold text-sm text-gray-700 truncate capitalize">{vendor.name}</h3>
                <p className="text-xs text-highlight-blue truncate mt-0.5">{vendor.address || 'Alamat tidak tersedia'}</p>
                <p className="text-sm font-semibold text-grey-500 mt-0.5">
                    {vendor.schedule?.open || '08:00'} - {vendor.schedule?.close || '21:00'}
                </p>
            </div>
        </div>
    );
}
