import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { getImageUrl } from '../utils/api';

// ATM & Shopping categories for filter
const atmCategories = [
    'Semua Kategori',
    'ATM',
    'Minimarket',
    'Supermarket',
    'Department Store',
];

export default function Atm({ vendors, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [atmBanners, setAtmBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    // Fetch ATM banners from settings
    useEffect(() => {
        setBannersLoading(true);
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.atm_banners) {
                    let banners = [];
                    if (Array.isArray(data.atm_banners)) {
                        banners = data.atm_banners;
                    } else if (data.atm_banners.banners && Array.isArray(data.atm_banners.banners)) {
                        banners = data.atm_banners.banners;
                    }

                    if (banners.length > 0) {
                        const validBanners = banners.filter(b =>
                            b.image && b.image.trim() !== ''
                        );
                        setAtmBanners(validBanners);
                    }
                }
            })
            .catch(err => console.error("Failed to load ATM banners", err))
            .finally(() => setBannersLoading(false));
    }, []);

    // Filter vendors by ATM/Shopping category
    const safeVendors = Array.isArray(vendors) ? vendors : [];
    const atmVendors = safeVendors.filter(v =>
        v.category?.toLowerCase().includes('atm') ||
        v.category?.toLowerCase().includes('minimarket') ||
        v.category?.toLowerCase().includes('supermarket') ||
        v.category?.toLowerCase().includes('convenience') ||
        v.category?.toLowerCase().includes('belanja') ||
        v.category?.toLowerCase().includes('store')
    );

    // Sort by distance
    useEffect(() => {
        let isMounted = true;

        const timer = setTimeout(() => {
            if (isMounted && loading) {
                setSortedVendors(atmVendors);
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
                    setSortedVendors(atmVendors);
                    setLoading(false);
                    clearTimeout(timer);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setSortedVendors(atmVendors);
            setLoading(false);
            clearTimeout(timer);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [vendors]);

    const sortVendors = (lat, lng) => {
        const sorted = [...atmVendors].map(v => {
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
        return matchesSearch;
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
            activeCategory="atm"
            title="ATM & Minimarket"
            subtitle="Senayan Mastercard"
            searchValue={searchQuery}
            onSearch={setSearchQuery}
        >
            {/* ATM Bank Banners - Horizontal Scroll */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent p-2.5">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-1.5">
                        {/* Loading Skeleton */}
                        {bannersLoading && [1, 2, 3, 4].map((i) => (
                            <div
                                key={`loading-${i}`}
                                className="w-32 h-24 rounded-2xl bg-grey-200 flex-shrink-0 animate-pulse"
                            />
                        ))}

                        {/* Actual Banners from Database */}
                        {!bannersLoading && atmBanners.map((banner) => (
                            <div
                                key={banner.id}
                                onClick={() => handleBannerClick(banner)}
                                className={`w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative group bg-white shadow-sm ${banner.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                                    }`}
                            >
                                {banner.image && (
                                    <img
                                        src={banner.image}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt={banner.title || 'ATM Banner'}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                {banner.title && (
                                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                        <div className="bg-grey-100/90 px-2 py-1 rounded-lg z-10">
                                            <span className="text-xs font-semibold text-grey-700">{banner.title}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Empty State */}
                        {!bannersLoading && atmBanners.length === 0 && (
                            <div className="w-full py-4 text-center text-grey-400">
                                <p className="text-sm">Belum ada banner ATM</p>
                            </div>
                        )}
                    </div>
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
                        <span className="text-4xl mb-3">🏪</span>
                        <p className="font-semibold">Belum ada toko</p>
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
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
                {/* Name */}
                <h3 className="font-semibold text-sm text-gray-700 truncate capitalize">
                    {vendor.name}
                </h3>

                {/* Address */}
                <p className="text-xs text-highlight-blue truncate mt-1">
                    {vendor.address || 'Alamat tidak tersedia'}
                </p>

                {/* Operating Hours */}
                <p className="text-sm font-semibold text-grey-500 mt-1">
                    {vendor.schedule?.open || '08:00'} - {vendor.schedule?.close || '21:00'}
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
