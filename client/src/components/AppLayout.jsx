import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../utils/api';
import { Search, X, User, ShoppingBag, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CategorySidebar from './CategorySidebar';

export default function AppLayout({
    children,
    title = 'Senayan Mastercard',
    subtitle = 'Jakarta Pusat',
    activeCategory,
    // Search props
    onSearch,
    searchValue
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const [logo, setLogo] = useState({ url: '', text: 'M' });
    const [isScrolled, setIsScrolled] = useState(false);

    // Detect Active Category if not provided
    const currentActive = activeCategory || (location.pathname === '/' ? 'rekomen' : location.pathname.substring(1));

    // Handle Search
    const currentSearchValue = searchValue !== undefined ? searchValue : internalSearchQuery;
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setInternalSearchQuery(val);
        if (onSearch) onSearch(val);
    };

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

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header - Fixed */}
            <header className={`fixed top-0 left-0 right-0 bg-white z-50 transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}>
                {/* Main Header Bar - Figma: HEAD */}
                <div className="flex items-center justify-between px-[10px] py-[5px] gap-[20px]">
                    {/* MRT Logo & Station Info */}
                    <div className="flex items-center gap-[10px]">
                        {/* MRT Logo */}
                        <div className="px-[5px]">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                                {logo.url ? (
                                    <img
                                        src={getImageUrl(logo.url, { w: 100, h: 100, resize: 'fit' })}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
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
                        </div>

                        {/* Station Name - Figma: Inter Bold, Black Ops One */}
                        <div className="flex flex-col gap-[5px]">
                            <h1 className="font-display text-[18px] uppercase tracking-[-0.05px] text-black leading-[17px]">
                                {title}
                            </h1>
                            <p className="font-semibold text-[14px] text-highlight-blue capitalize leading-[10px] tracking-[-0.05px]">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Right actions - Figma: search + menu dots */}
                    <div className="flex items-center gap-[30px] pl-[5px] pr-[10px]">
                        {/* Search Button - Figma: border circle */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="w-[34px] h-[34px] border border-grey-300 rounded-full flex items-center justify-center hover:bg-grey-100 transition-colors p-[5px]"
                        >
                            <Search size={24} className="text-grey-600" />
                        </button>
                        {/* Menu Dots - Figma: 3 dots vertical */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="flex flex-col gap-[3px] w-[12px]"
                        >
                            <div className="w-full aspect-square bg-grey-600 rounded-full" />
                            <div className="w-full aspect-square bg-grey-600 rounded-full" />
                            <div className="w-full aspect-square bg-grey-600 rounded-full" />
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
                                    placeholder="Cari toko, tempat, atau fasilitas..."
                                    className="w-full bg-grey-100 border border-grey-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-highlight-blue/20 transition-all text-sm"
                                    value={currentSearchValue}
                                    onChange={handleSearchChange}
                                    autoFocus
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Layout - Figma: flex row */}
            <div
                className="fixed left-0 right-0 bottom-0 flex transition-all duration-300 ease-in-out"
                style={{ top: isSearchOpen ? '114px' : '58px' }}
            >
                {/* Left Sidebar - Figma: 80px width, Main Menu */}
                <div className="bg-white w-[80px] flex-shrink-0 overflow-y-auto">
                    <CategorySidebar activeCategory={currentActive} />
                </div>

                {/* Main Content Area - Figma: content/homepage/rekomendasi */}
                <main
                    className="flex-1 bg-grey-100 rounded-tl-[30px] overflow-y-auto overflow-x-hidden pb-24 pt-0"
                    onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 10)}
                >
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
