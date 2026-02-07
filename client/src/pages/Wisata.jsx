import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, ShoppingBag, HelpCircle, MapPin, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Static destination data organized by sections - Tourism spots in Jakarta
const destinationSections = [
    {
        id: 'museum',
        title: 'Wisata Sejarah & Museum',
        destinations: [
            { id: 1, name: 'Museum Nasional', subtitle: '(Museum Gajah)', distance: '4.5 km', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop' },
            { id: 2, name: 'Museum Fatahilah', subtitle: '(Sejarah Jakarta)', distance: '9.5 km', image: 'https://images.unsplash.com/photo-1555217851-6141535b3d5a?w=400&h=300&fit=crop' },
            { id: 3, name: 'Museum Wayang', subtitle: '', distance: '9.6 km', image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=300&fit=crop' },
            { id: 4, name: 'Museum Seni Rupa', subtitle: '& Keramik', distance: '9.6 km', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop' },
        ]
    },
    {
        id: 'culture',
        title: 'Wisata Budaya & Seni',
        destinations: [
            { id: 5, name: 'Taman Ismail', subtitle: 'Marzuki (TIM)', distance: '4.2 km', image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400&h=300&fit=crop' },
            { id: 6, name: 'Gedung', subtitle: 'Kesenian Jakarta', distance: '5.5 km', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop' },
            { id: 7, name: 'Galeri Nasional', subtitle: 'Indonesia', distance: '5 km', image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop' },
            { id: 8, name: 'Balai Budaya', subtitle: '', distance: '4 km', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop' },
        ]
    },
    {
        id: 'religi',
        title: 'Wisata Religi',
        destinations: [
            { id: 9, name: 'Masjid Istiqlal', subtitle: '', distance: '5.5 km', image: 'https://images.unsplash.com/photo-1564769625688-5f043d6b1bc3?w=400&h=300&fit=crop' },
            { id: 10, name: 'Gereja Katedral', subtitle: 'Jakarta', distance: '5.6 km', image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop' },
            { id: 11, name: 'Masjid', subtitle: 'Sunda Kelapa', distance: '3.5 km', image: 'https://images.unsplash.com/photo-1537031934800-b8a1bb8bf841?w=400&h=300&fit=crop' },
            { id: 12, name: 'Vihara', subtitle: 'Bahtera Bhakti', distance: '9.2 km', image: 'https://images.unsplash.com/photo-1545296664-39db56ad95bd?w=400&h=300&fit=crop' },
        ]
    },
    {
        id: 'nature',
        title: 'Wisata Alam & Ruang Terbuka',
        destinations: [
            { id: 13, name: 'Monas &', subtitle: 'Taman Sekitarnya', distance: '4.7 km', image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop' },
            { id: 14, name: 'Gelora Bung Karno', subtitle: '(GBK)', distance: '300 m', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop' },
            { id: 15, name: 'Taman Lapangan', subtitle: 'Banteng', distance: '5.5 km', image: 'https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=400&h=300&fit=crop' },
            { id: 16, name: 'Pantai Ancol', subtitle: '', distance: '11 km', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
        ]
    },
    {
        id: 'family',
        title: 'Wisata Keluarga & Rekreasi',
        destinations: [
            { id: 17, name: 'Dunia Fantasi', subtitle: '(Dufan)', distance: '11 km', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400&h=300&fit=crop' },
            { id: 18, name: 'Atlantis Water', subtitle: 'Adventure', distance: '11 km', image: 'https://images.unsplash.com/photo-1570867830587-f72acb2f77b6?w=400&h=300&fit=crop' },
            { id: 19, name: 'Snowbay', subtitle: '', distance: '18 km', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
            { id: 20, name: 'Sea World', subtitle: 'Ancol', distance: '11 km', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop' },
        ]
    }
];

// Category sidebar data
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', path: '/' },
    { id: 'publik', label: 'Publik', icon: '🛋️', path: '/publik' },
    { id: 'kuliner', label: 'Kuliner', icon: '🍳', path: '/kuliner' },
    { id: 'ngopi', label: 'Ngopi', icon: '☕', path: '/ngopi' },
    { id: 'wisata', label: 'Wisata', icon: '🏛️', path: '/wisata' },
    { id: 'atm', label: 'ATM &', sublabel: 'Belanja', icon: '🏪', path: '/atm' },
];

export default function Wisata() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryClick = (category) => {
        navigate(category.path);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-white z-50">
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    {/* MRT Logo & Page Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">M</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-display text-lg uppercase tracking-tight text-black leading-tight">
                                Tempat Wisata
                            </h1>
                            <h1 className="font-display text-lg uppercase tracking-tight text-black leading-tight">
                                Jakarta
                            </h1>
                            <p className="text-highlight-blue font-semibold text-sm capitalize">
                                Senayan Mastercard
                            </p>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="w-10 h-10 border border-grey-300 rounded-full flex items-center justify-center hover:bg-grey-100 transition-colors"
                        >
                            <Search size={18} className="text-grey-600" />
                        </button>
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
                                    placeholder="Cari tempat wisata..."
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
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${category.id === 'wisata'
                                    ? 'bg-gradient-to-b from-green-400 to-white shadow-md'
                                    : 'bg-transparent hover:bg-grey-100'
                                    }`}
                            >
                                {category.icon}
                            </div>
                            <span className="text-xs font-semibold text-center leading-tight text-grey-600">
                                {category.label}
                            </span>
                            {category.sublabel && (
                                <span className="text-xs font-semibold text-center leading-tight text-grey-600 -mt-1">
                                    {category.sublabel}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <main className="flex-1 bg-grey-100 rounded-tl-3xl overflow-y-auto pb-6">
                    {/* Video Banner Placeholder */}
                    <div className="p-2.5">
                        <div className="relative w-full aspect-[3/2] max-h-[200px] bg-grey-300 rounded-2xl overflow-hidden flex items-center justify-center">
                            <img
                                src="https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop"
                                alt="Jakarta cityscape"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                            <button className="absolute w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                                <Play size={32} className="text-grey-600 ml-1" fill="currentColor" />
                            </button>
                        </div>
                    </div>

                    {/* Destination Sections */}
                    {destinationSections.map((section) => (
                        <DestinationSection key={section.id} section={section} />
                    ))}
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
                                    <p className="text-[10px] text-primary/70 mb-3">Hubungi CS kami jika ada kendala.</p>
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

// Section Component
function DestinationSection({ section }) {
    return (
        <div className="py-2">
            {/* Section Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <h2 className="font-bold text-[15px] text-black capitalize">
                    {section.title}
                </h2>
                <ChevronRight size={16} className="text-grey-600" />
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="overflow-x-auto no-scrollbar px-2.5">
                <div className="flex gap-1.5">
                    {section.destinations.map((dest) => (
                        <DestinationCard key={dest.id} destination={dest} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Destination Card Component matching Figma design
function DestinationCard({ destination }) {
    return (
        <div className="w-[200px] h-[133px] rounded-[15px] overflow-hidden flex-shrink-0 cursor-pointer relative group">
            {/* Background Image */}
            <img
                src={destination.image}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

            {/* Distance Badge (Top Left) */}
            <div className="absolute top-5 left-5 flex items-center gap-1.5">
                <MapPin size={12} className="text-white" />
                <span className="text-white text-sm font-semibold lowercase">
                    {destination.distance}
                </span>
            </div>

            {/* Title (Bottom) */}
            <div className="absolute bottom-4 left-5 right-5">
                <p className="text-grey-200 text-sm font-semibold capitalize leading-tight">
                    {destination.name}
                </p>
                {destination.subtitle && (
                    <p className="text-grey-200 text-sm font-semibold capitalize leading-tight">
                        {destination.subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
