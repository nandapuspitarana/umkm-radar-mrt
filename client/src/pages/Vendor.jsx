import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/api';
import { ArrowLeft, ChevronRight, Star, Clock, MapPin, CreditCard, Wallet, Banknote, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Payment method icons
const PaymentBadge = () => (
    <div className="backdrop-blur-sm bg-white/80 rounded-xl px-2.5 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-grey-600">
            <Banknote size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Cash</span>
        </div>
        <div className="w-px h-4 bg-grey-300" />
        <div className="flex items-center gap-1.5 text-grey-600">
            <span className="text-[10px] font-bold">QRIS</span>
        </div>
        <div className="w-px h-4 bg-grey-300" />
        <div className="flex items-center gap-1.5 text-emerald-600">
            <Wallet size={12} />
            <span className="text-[10px] font-semibold">GoPay</span>
        </div>
        <div className="w-px h-4 bg-grey-300" />
        <div className="flex items-center gap-1.5 text-grey-600">
            <CreditCard size={12} />
            <span className="text-[10px] font-semibold uppercase">Debit</span>
        </div>
    </div>
);

// Format price without currency symbol for cleaner display
const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price);
};

export default function Vendor({ vendor, products, onBack, onAddToCart, cart }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userDistance, setUserDistance] = useState(null);

    // Calculate distance from user
    useEffect(() => {
        if (navigator.geolocation && vendor?.location?.lat && vendor?.location?.lng) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const distance = calculateDistance(
                        latitude,
                        longitude,
                        vendor.location.lat,
                        vendor.location.lng
                    );
                    setUserDistance(distance);
                },
                () => {
                    // If geolocation fails, show fallback
                    setUserDistance(null);
                }
            );
        }
    }, [vendor]);

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
        if (distance === null || distance === undefined) return '150 m';
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${distance.toFixed(1)} km`;
    };

    const categories = ['Semua', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const operatingHours = vendor?.schedule
        ? `${vendor.schedule.open || '08:00'} - ${vendor.schedule.close || '21:00'}`
        : '08:00 - 21:00';

    return (
        <div className="min-h-screen bg-grey-100 flex flex-col">
            {/* Sticky Header - CTA-GO Style from Figma */}
            <header className="sticky top-0 z-50 bg-white backdrop-blur-lg">
                <div className="flex items-center justify-between py-2.5 px-4">
                    {/* Back Button & Vendor Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-grey-100 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={20} className="text-grey-700" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h1 className="font-black text-[15px] text-[#242424] tracking-wide truncate capitalize">
                                {vendor?.name}
                            </h1>
                            <p className="text-[13px] font-semibold text-grey-600 truncate">
                                {operatingHours}
                            </p>
                        </div>
                    </div>

                    {/* Distance Badge */}
                    <div className="bg-highlight-blue rounded-full px-3 py-1.5 flex items-center gap-1">
                        <span className="text-white text-[15px] font-bold lowercase">
                            {formatDistance(userDistance)}
                        </span>
                        <ChevronRight size={14} className="text-white" />
                    </div>
                </div>
            </header>

            {/* Hero Image Section */}
            <div className="relative h-[320px] w-full bg-grey-200 overflow-hidden">
                {vendor?.image ? (
                    <img
                        src={getImageUrl(vendor.image, { w: 800, h: 400, resize: 'cover' })}
                        alt={vendor.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
                        <span className="text-6xl">🏪</span>
                    </div>
                )}

                {/* Payment Methods Overlay */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <PaymentBadge />
                </div>
            </div>

            {/* Product List */}
            <main className="flex-1 px-2.5 py-2.5 pb-24">
                <div className="flex flex-col gap-2.5">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-grey-600">
                            <span className="text-4xl mb-3">📦</span>
                            <p className="font-semibold">Tidak ada produk</p>
                            <p className="text-sm">Coba kategori atau pencarian lain</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={() => onAddToCart(product)}
                            />
                        ))
                    )}
                </div>
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// Product Card Component matching Figma design - Merchant line up style
function ProductCard({ product, onAdd }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-grey-200 rounded-2xl px-1.5 py-1 flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onAdd}
        >
            {/* Thumbnail - 60x60 rounded */}
            <div className="w-[60px] h-[60px] rounded-[15px] overflow-hidden flex-shrink-0 bg-grey-100">
                {product.image ? (
                    <img
                        src={getImageUrl(product.image, { w: 120, h: 120, resize: 'crop' })}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-amber-50 to-orange-100">
                        🍽️
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0 py-2">
                {/* Product Name */}
                <h3 className="font-semibold text-[14px] text-grey-700 truncate capitalize tracking-wide leading-none mb-1.5">
                    {product.name}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-grey-400 font-semibold truncate capitalize leading-tight">
                    {product.description || product.category}
                </p>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 pr-2">
                <p className="text-[16px] font-semibold text-grey-700 lowercase tracking-tight">
                    {formatPrice(product.discountPrice || product.price)}
                </p>
            </div>
        </motion.div>
    );
}
