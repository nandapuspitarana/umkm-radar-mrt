import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { getImageUrl } from '../utils/api';

// Kuliner banners will be fetched from API

// Kuliner categories for filter
const kulinerCategories = [
    'Semua Kategori',
    'Nasi & Lontong',
    'Mie & Bakmi',
    'Bubur',
    'Warung Padang',
    'Convenience Store',
];

export default function Kuliner({ vendors, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kulinerBanners, setKulinerBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    // Fetch kuliner banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            setBannersLoading(true);
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.kuliner_banners && Array.isArray(data.kuliner_banners)) {
                    setKulinerBanners(data.kuliner_banners);
                }
            } catch (error) {
                console.error('Failed to fetch kuliner banners:', error);
            } finally {
                setBannersLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // Filter vendors by kuliner category
    const safeVendors = Array.isArray(vendors) ? vendors : [];
    const kulinerVendors = safeVendors.filter(v =>
        v.category?.toLowerCase().includes('kuliner') ||
        v.category?.toLowerCase().includes('makanan') ||
        v.category?.toLowerCase().includes('food') ||
        v.category?.toLowerCase().includes('restaurant') ||
        v.category?.toLowerCase().includes('warung') ||
        v.category?.toLowerCase().includes('convenience')
    );

    // Sort by distance
    useEffect(() => {
        let isMounted = true;

        const timer = setTimeout(() => {
            if (isMounted && loading) {
                setSortedVendors(kulinerVendors);
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
                    setSortedVendors(kulinerVendors);
                    setLoading(false);
                    clearTimeout(timer);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setSortedVendors(kulinerVendors);
            setLoading(false);
            clearTimeout(timer);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [vendors]);

    const sortVendors = (lat, lng) => {
        const sorted = [...kulinerVendors].map(v => {
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

    const formatDistance = (distance) => {
        if (distance === null || distance === undefined) return null;
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${distance.toFixed(1)} km`;
    };

    // Filter by search and category
    const filteredVendors = sortedVendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.address?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Semua Kategori' || v.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleBannerClick = (banner) => {
        if (!banner.link) return;

        // Check if it's an external link
        if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
            window.open(banner.link, '_blank');
        } else {
            // Internal link - use navigate
            navigate(banner.link);
        }
    };

    return (
        <AppLayout
            activeCategory="kuliner"
            title="Kulineran"
            subtitle="Senayan Mastercard"
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* Category Filter */}
            <div className="sticky top-0 z-10 bg-grey-100 p-2.5">
                <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-white border border-grey-300 rounded-full py-2.5 px-4 flex items-center justify-between hover:bg-grey-100 transition-colors"
                >
                    <span className="text-grey-600">{selectedCategory}</span>
                    <ChevronDown size={20} className={`text-grey-600 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Category Dropdown */}
                <AnimatePresence>
                    {isCategoryOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-2.5 right-2.5 mt-1 bg-white rounded-2xl shadow-lg border border-grey-200 overflow-hidden z-20"
                        >
                            {kulinerCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsCategoryOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-grey-100 transition-colors ${selectedCategory === cat ? 'bg-grey-100 text-highlight-blue font-semibold' : 'text-grey-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kuliner Banners */}
            <div className="overflow-x-auto no-scrollbar px-2.5">
                <div className="flex gap-1.5 pb-2.5">
                    {/* Loading Skeleton */}
                    {bannersLoading && [1, 2, 3, 4].map((i) => (
                        <div
                            key={`loading-${i}`}
                            className="w-48 h-48 rounded-2xl bg-grey-200 flex-shrink-0 animate-pulse"
                        />
                    ))}

                    {/* Actual Banners from Database */}
                    {!bannersLoading && kulinerBanners.map((banner) => (
                        <div
                            key={banner.id}
                            onClick={() => handleBannerClick(banner)}
                            className={`w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0 relative group ${banner.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                                }`}
                        >
                            {banner.image && (
                                <img
                                    src={banner.image}
                                    alt={banner.title || 'Kuliner Banner'}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
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

                    {/* Empty State */}
                    {!bannersLoading && kulinerBanners.length === 0 && (
                        <div className="w-full py-8 text-center text-grey-400">
                            <p className="text-sm">Belum ada banner kuliner</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Vendor List */}
            <div className="flex flex-col gap-2.5 px-2.5 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-grey-600">
                        <span className="text-4xl mb-3">🍽️</span>
                        <p className="font-semibold">Belum ada warung makan</p>
                        <p className="text-sm">Coba ubah filter atau cari yang lain</p>
                    </div>
                ) : (
                    filteredVendors.map((vendor) => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            distance={formatDistance(vendor.distance)}
                            onClick={() => onSelectVendor && onSelectVendor(vendor)}
                        />
                    ))
                )}
            </div>
        </AppLayout>
    );
}

// Vendor Card Component matching Figma design
function VendorCard({ vendor, distance, onClick }) {
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
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
                {/* Name */}
                <h3 className="font-semibold text-sm text-gray-700 truncate capitalize">
                    {vendor.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-grey-400 truncate mt-0.5">
                    {vendor.description || vendor.category || 'Makanan lezat'}
                </p>

                {/* Address */}
                <p className="text-xs text-highlight-blue truncate mt-0.5">
                    {vendor.address || 'Alamat tidak tersedia'}
                </p>

                {/* Operating Hours */}
                <p className="text-sm font-semibold text-grey-500 mt-0.5">
                    {vendor.schedule?.open || '06:00'} - {vendor.schedule?.close || '22:00'}
                </p>
            </div>

            {/* Distance Badge */}
            {distance && (
                <div className="absolute bottom-2 right-2.5 bg-grey-100 px-2 py-1 rounded-lg">
                    <span className="text-sm font-semibold text-grey-400 lowercase">{distance}</span>
                </div>
            )}
        </div>
    );
}
