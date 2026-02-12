import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Category menu items
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', path: '/' },
    { id: 'publik', label: 'Publik', icon: '🛋️', path: '/publik' },
    { id: 'kuliner', label: 'Kuliner', icon: '🍳', path: '/kuliner' },
    { id: 'ngopi', label: 'Ngopi', icon: '☕', path: '/ngopi' },
    { id: 'wisata', label: 'Wisata', icon: '🏛️', path: '/wisata' },
    { id: 'atm', label: 'ATM & Belanja', icon: '🏪', path: '/atm' },
];

export default function AppLayout({ children, title = 'UMKM Radar', subtitle = 'Senayan Mastercard', activeCategory = 'rekomen' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logo, setLogo] = useState({ url: '', text: 'M' });

    useEffect(() => {
        // Fetch logo from settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                let logoUrl = '';
                let logoText = 'M';

                // Parse app_logo
                if (data.app_logo) {
                    logoUrl = typeof data.app_logo === 'string'
                        ? data.app_logo
                        : (data.app_logo.url || data.app_logo.logo || '');
                }

                // Parse app_logo_text
                if (data.app_logo_text) {
                    logoText = typeof data.app_logo_text === 'string'
                        ? data.app_logo_text
                        : (data.app_logo_text.text || 'M');
                }

                setLogo({ url: logoUrl, text: logoText });
            })
            .catch(err => console.error('Failed to load logo settings:', err));
    }, []);

    const handleCategoryClick = (category) => {
        navigate(category.path);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header - Fixed */}
            <header className="fixed top-0 left-0 right-0 bg-white z-50">
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    {/* MRT Logo & Page Title */}
                    <div className="flex items-center gap-3">
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
                        <div className="flex flex-col">
                            <h1 className="font-display text-lg uppercase tracking-tight text-black leading-tight">
                                {title}
                            </h1>
                            <p className="text-highlight-blue font-semibold text-sm capitalize">
                                {subtitle}
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
                                    placeholder="Cari..."
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

            {/* Main Layout - Fixed positioning */}
            <div className="fixed top-[73px] left-0 right-0 bottom-0 flex">
                {/* Left Sidebar - Category Menu (Fixed) */}
                <div className="flex flex-col gap-6 py-4 px-2 bg-white w-20 flex-shrink-0 overflow-y-auto">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category)}
                            className="flex flex-col items-center gap-1.5 group"
                        >
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${category.id === activeCategory
                                    ? 'bg-gradient-to-b from-green-400 to-white shadow-md'
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

                {/* Main Content Area - Scrollable */}
                <main className="flex-1 bg-grey-100 rounded-tl-3xl overflow-y-auto">
                    {children}
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
