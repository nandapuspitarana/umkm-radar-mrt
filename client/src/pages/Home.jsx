import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingCart, Search, Menu, X, HelpCircle, User, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home({ vendors, onSelectVendor }) {
    const [sortedVendors, setSortedVendors] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3); // Start with 3
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');

    // Extract unique categories from vendors with safety check
    const safeVendors = Array.isArray(vendors) ? vendors : [];
    const categories = ['Semua', ...new Set(safeVendors.map(v => v.category).filter(Boolean))];

    // Logic to get location and sort
    useEffect(() => {
        let isMounted = true;

        // Safety timeout: stop loading after 5s even if geo hangs
        const timer = setTimeout(() => {
            if (isMounted && loading) {
                console.log("Geo timeout, showing unsorted");
                setSortedVendors(Array.isArray(vendors) ? vendors : []);
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
                    console.error("Geo error:", error);
                    setSortedVendors(Array.isArray(vendors) ? vendors : []);
                    setLoading(false);
                    clearTimeout(timer);
                },
                { timeout: 5000, enableHighAccuracy: false } // Add timeout option
            );
        } else {
            setSortedVendors(Array.isArray(vendors) ? vendors : []);
            setLoading(false);
            clearTimeout(timer);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [vendors]);

    const sortVendors = (lat, lng) => {
        if (!Array.isArray(vendors)) return;
        const sorted = [...vendors].map(v => {
            // Safety check for location data
            if (!v.location || !v.location.lat || !v.location.lng) {
                return { ...v, distance: null };
            }
            return {
                ...v,
                distance: calculateDistance(lat, lng, v.location.lat, v.location.lng)
            };
        }).sort((a, b) => {
            // Put vendors without distance at the end
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
        setSortedVendors(sorted);
        setLoading(false);
    };

    const filteredVendors = sortedVendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Semua' || v.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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

    const checkShopStatus = (schedule) => {
        if (!schedule) return { isOpen: true, text: 'Buka', color: 'text-green-600' };

        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        if (schedule.days && !schedule.days.includes(day)) {
            return { isOpen: false, text: 'Tutup (Hari Libur)', color: 'text-red-500' };
        }

        if (schedule.openTime && schedule.closeTime) {
            if (currentTime < schedule.openTime || currentTime > schedule.closeTime) {
                return { isOpen: false, text: 'Tutup', color: 'text-red-500' };
            }
        }

        return { isOpen: true, text: 'Buka', color: 'text-green-600' };
    };

    return (
        <div className="min-h-screen bg-bg pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-500 rounded-lg flex items-center justify-center text-white text-lg">
                            🥬
                        </div>
                        <span className="font-serif font-bold text-xl text-primary">FreshMart</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => { console.log('Menu clicked'); setIsMenuOpen(true); }}>
                        <Menu size={18} className="text-gray-600" />
                    </div>
                </div>

                {/* Search */}
                <div className="max-w-md mx-auto px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari toko terdekat..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="max-w-md mx-auto px-4 pb-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === category
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif font-bold text-xl text-gray-800">Toko Sekitarmu</h2>
                    <span className="text-xs font-bold text-primary bg-green-50 px-2 py-1 rounded-lg">
                        📍 Sesuai Lokasi
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-24 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">



                        {filteredVendors.slice(0, visibleCount).map(vendor => {
                            const status = checkShopStatus(vendor.schedule);
                            return (
                                <motion.div
                                    key={vendor.id}
                                    // ... props
                                    className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-colors flex gap-4 ${!status.isOpen ? 'opacity-75 grayscale-[0.5]' : 'hover:border-primary/50'}`}
                                    onClick={() => onSelectVendor(vendor)} // click handler
                                >
                                    {/* ... Image ... */}
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                        {vendor.image ? (
                                            <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl bg-blue-50">🏪</div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 mb-1">{vendor.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[200px]">{vendor.locationTags || vendor.address}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-orange-500">★ {vendor.rating}</span>
                                            {vendor.distance && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="font-bold text-primary">{vendor.distance.toFixed(1)} km</span>
                                                </>
                                            )}
                                            <span className="text-gray-300">•</span>
                                            <span className={`${status.color} font-medium`}>{status.text}</span>
                                            {!status.isOpen && vendor.schedule?.openTime && (
                                                <span className="text-gray-400 ml-1">Buka {vendor.schedule.openTime}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && visibleCount < sortedVendors.length && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 3)}
                            className="text-sm font-bold text-green-700 bg-green-50 px-6 py-3 rounded-xl hover:bg-green-100 transition-colors w-full"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </main>

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
                                <span className="font-serif font-bold text-xl text-primary">FreshMart</span>
                                <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <nav className="space-y-2">
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors">
                                    <User size={20} />
                                    <span className="font-medium">Akun Saya</span>
                                </a>
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors">
                                    <ShoppingBag size={20} />
                                    <span className="font-medium">Pesanan Saya</span>
                                </a>
                                <a href="/about" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors">
                                    <HelpCircle size={20} />
                                    <span className="font-medium">Tentang Kami</span>
                                </a>
                            </nav>

                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-xs text-green-800 font-bold mb-1">Butuh Bantuan?</p>
                                    <p className="text-[10px] text-green-600 mb-3">Hubungi CS kami jika ada kendala pemesanan.</p>
                                    <button className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700">Chat CS</button>
                                </div>
                                <p className="text-[10px] text-gray-400 text-center mt-4">v1.0.0 FreshMart</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
