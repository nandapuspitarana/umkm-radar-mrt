import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ATM Bank data with static images
const atmBanks = [
    { id: 1, name: 'Bank BCA', image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=300&fit=crop', distance: '30 m' },
    { id: 2, name: 'Bank Mandiri', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', distance: '30 m' },
    { id: 3, name: 'Bank BNI', image: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400&h=300&fit=crop', distance: '52 m' },
    { id: 4, name: 'Bank BTPN', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop', distance: '52 m' },
    { id: 5, name: 'Bank BTN', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop', distance: '224 m' },
    { id: 6, name: 'Bank Danamon', image: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400&h=300&fit=crop', distance: '318 m' },
];

// Category sidebar data
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', path: '/' },
    { id: 'publik', label: 'Publik', icon: '🛋️', path: '/publik' },
    { id: 'kuliner', label: 'Kuliner', icon: '🍳', path: '/kuliner' },
    { id: 'ngopi', label: 'Ngopi', icon: '☕', path: '/ngopi' },
    { id: 'wisata', label: 'Wisata', icon: '🏛️', path: '/wisata' },
    { id: 'atm', label: 'ATM & Belanja', icon: '🏪', path: '/atm' },
];

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Handle category navigation
    const handleCategoryClick = (category) => {
        navigate(category.path);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-white z-50">
                {/* Main Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    {/* MRT Logo & Page Title */}
                    <div className="flex items-center gap-3">
                        {/* MRT Icon */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">M</span>
                        </div>
                        {/* Page Title */}
                        <div className="flex flex-col">
                            <h1 className="font-display text-lg uppercase tracking-tight text-black leading-tight">
                                ATM & Minimarket
                            </h1>
                            <p className="text-highlight-blue font-semibold text-sm capitalize">
                                Senayan Mastercard
                            </p>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        {/* Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="w-10 h-10 border border-grey-300 rounded-full flex items-center justify-center hover:bg-grey-100 transition-colors"
                        >
                            <Search size={18} className="text-grey-600" />
                        </button>
                        {/* Menu Dots */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="flex flex-col gap-1 p-2"
                        >
                            <div className="w-1.5 h-1.5 bg-grey-600 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-grey-600 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-grey-600 rounded-full" />
                        </button>
                    </div>
                </div>

                {/* Search Bar (expandable) */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden px-4 pb-3"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari ATM atau toko..."
                                    className="w-full bg-grey-100 border border-grey-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-highlight-blue/20 transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Category Menu */}
                <div className="flex flex-col gap-6 py-4 px-2 bg-white h-full w-20 flex-shrink-0">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category)}
                            className="flex flex-col items-center gap-1.5 group"
                        >
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${category.id === 'atm'
                                    ? 'bg-gradient-to-b from-fuchsia-400 to-white shadow-md'
                                    : 'bg-transparent hover:bg-grey-100'
                                    }`}
                            >
                                {category.icon}
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight text-grey-600">
                                {category.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <main className="flex-1 bg-grey-100 rounded-tl-3xl overflow-y-auto">
                    {/* ATM Bank Banners - Horizontal Scroll */}
                    <div className="sticky top-0 z-10 bg-gradient-to-b from-grey-100 via-grey-100/80 to-transparent p-2.5">
                        <div className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-1.5">
                                {atmBanks.map((bank) => (
                                    <div
                                        key={bank.id}
                                        className="w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer relative group bg-white"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                                            <span className="text-3xl">🏧</span>
                                        </div>
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                            <div className="bg-grey-100 px-2 py-1 rounded-lg">
                                                <span className="text-sm font-semibold text-grey-400 lowercase">{bank.distance}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                </main>
            </div>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[60] shadow-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-display text-lg text-black uppercase">UMKM Radar</span>
                                <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-grey-100 rounded-full">
                                    <X size={20} className="text-grey-600" />
                                </button>
                            </div>

                            <nav className="space-y-2">
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-grey-600 hover:bg-grey-100 hover:text-primary rounded-xl transition-colors">
                                    <User size={20} />
                                    <span className="font-medium">Akun Saya</span>
                                </a>
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-grey-600 hover:bg-grey-100 hover:text-primary rounded-xl transition-colors">
                                    <ShoppingBag size={20} />
                                    <span className="font-medium">Pesanan Saya</span>
                                </a>
                                <a href="/about" className="flex items-center gap-3 px-4 py-3 text-grey-600 hover:bg-grey-100 hover:text-primary rounded-xl transition-colors">
                                    <HelpCircle size={20} />
                                    <span className="font-medium">Tentang Kami</span>
                                </a>
                            </nav>

                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-primary/10 p-4 rounded-xl">
                                    <p className="text-xs text-primary font-bold mb-1">Butuh Bantuan?</p>
                                    <p className="text-[10px] text-primary/70 mb-3">Hubungi CS kami jika ada kendala pemesanan.</p>
                                    <button className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                        Chat CS
                                    </button>
                                </div>
                                <p className="text-[10px] text-grey-300 text-center mt-4">v1.0.0 UMKM Radar MRT</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
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
                    <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
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
                    {vendor.schedule?.open || '06:00'} - {vendor.schedule?.close || '21:00'}
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
