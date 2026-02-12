import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Promotional banners data for coffee
const promoBanners = [
    { id: 1, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', title: 'Promo Kopi' },
    { id: 2, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', title: 'Kopi Kenangan' },
    { id: 3, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', title: 'Indomaret Point' },
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

// Ngopi categories for filter
const ngopiCategories = [
    'Semua Kategori',
    'Coffee Shop',
    'Kopi Lokal',
    'Franchise',
    'Specialty Coffee',
];

export default function Ngopi({ vendors, onSelectVendor }) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logo, setLogo] = useState({ url: '', text: 'M' });

    // Fetch logo from settings
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                let logoUrl = '';
                let logoText = 'M';

                if (data.app_logo) {
                    logoUrl = typeof data.app_logo === 'string'
                        ? data.app_logo
                        : (data.app_logo.url || data.app_logo.logo || '');
                }

                if (data.app_logo_text) {
                    logoText = typeof data.app_logo_text === 'string'
                        ? data.app_logo_text
                        : (data.app_logo_text.text || 'M');
                }

                setLogo({ url: logoUrl, text: logoText });
            })
            .catch(err => console.error('Failed to load logo settings:', err));
    }, []);

    // Filter vendors by ngopi/coffee category
    const safeVendors = Array.isArray(vendors) ? vendors : [];
    const ngopiVendors = safeVendors.filter(v =>
        v.category?.toLowerCase().includes('ngopi') ||
        v.category?.toLowerCase().includes('coffee') ||
        v.category?.toLowerCase().includes('kopi') ||
        v.category?.toLowerCase().includes('cafe')
    );

    // Sort by distance
    useEffect(() => {
        let isMounted = true;

        const timer = setTimeout(() => {
            if (isMounted && loading) {
                setSortedVendors(ngopiVendors);
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
                    setSortedVendors(ngopiVendors);
                    setLoading(false);
                    clearTimeout(timer);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setSortedVendors(ngopiVendors);
            setLoading(false);
            clearTimeout(timer);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [vendors]);

    const sortVendors = (lat, lng) => {
        const sorted = [...ngopiVendors].map(v => {
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
            <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
                {/* Main Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    {/* MRT Logo & Page Title */}
                    <div className="flex items-center gap-3">
                        {/* MRT Icon */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                            {logo.url ? (
                                <img
                                    src={logo.url}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <span
                                className="text-grey-900 text-2xl font-bold"
                                style={{ display: logo.url ? 'none' : 'block' }}
                            >
                                {logo.text}
                            </span>
                        </div>
                        {/* Page Title */}
                        <div className="flex flex-col">
                            <h1 className="font-display text-lg uppercase tracking-tight text-black leading-tight">
                                Ngopi
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
                                    placeholder="Cari kedai kopi atau cafe..."
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
            <div className="fixed top-[73px] left-0 right-0 bottom-0 flex">
                {/* Left Sidebar - Category Menu */}
                <div className="flex flex-col gap-6 py-4 px-2 bg-white w-20 flex-shrink-0 overflow-y-auto">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category)}
                            className="flex flex-col items-center gap-1.5 group"
                        >
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${category.id === 'ngopi'
                                    ? 'bg-gradient-to-b from-amber-600 to-white shadow-md'
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
                <main className="flex-1 bg-grey-100 rounded-tl-3xl overflow-y-auto pb-20">
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
                                    {ngopiCategories.map((cat) => (
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

                    {/* Promo Banners */}
                    <div className="overflow-x-auto no-scrollbar px-2.5">
                        <div className="flex gap-1.5 pb-2.5">
                            {promoBanners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className="w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer relative group"
                                >
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                            ))}
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
                                <span className="text-4xl mb-3">☕</span>
                                <p className="font-semibold">Belum ada kedai kopi</p>
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
                    <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
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
