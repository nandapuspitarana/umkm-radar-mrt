import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Package,
    Ticket,
    Store,
    Image,
    Tag,
    Navigation2,
    MapPin,
    FileImage,
    CreditCard,
    Utensils,
    Coffee,
    Landmark,
    LayoutGrid,
    Laptop,
    Train,
    Bus,
    Layers,
    Users,
    ClipboardList,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

// ─── Grouped menu config ───────────────────────────────────────────────────────
const ADMIN_MENU = [
    {
        group: null, // top-level, no header
        items: [
            { icon: LayoutDashboard, label: 'Overview', path: '/' },
            { icon: Store, label: 'Mitra & Lokasi', path: '/vendors', role: 'admin' },
            { icon: Package, label: 'Produk Saya', path: '/products', role: 'vendor' },
            { icon: Ticket, label: 'Voucher & Promo', path: '/vouchers' },
        ]
    },
    {
        group: 'Konten & Data',
        adminOnly: true,
        items: [
            { icon: Train, label: 'Stasiun MRT', path: '/station-categories' },
            { icon: MapPin, label: 'Destinasi Wisata', path: '/destinations' },
            { icon: LayoutGrid, label: 'Menu Utama App', path: '/main-menu' },
            { icon: Bus, label: 'Icon Transport', path: '/transport-icons' },
            { icon: Layers, label: 'Sub-Kategori', path: '/sub-kategori' },
        ]
    },
    {
        group: 'Manajemen Banner',
        adminOnly: true,
        collapsible: true,
        items: [
            { icon: FileImage, label: 'Banner Publik', path: '/publik-banner' },
            { icon: CreditCard, label: 'Banner ATM', path: '/atm-banners' },
            { icon: Utensils, label: 'Banner Kuliner', path: '/kuliner-banners' },
            { icon: Coffee, label: 'Banner Ngopi', path: '/ngopi-banners' },
            { icon: Landmark, label: 'Banner Wisata', path: '/wisata-banner' },
            { icon: LayoutGrid, label: 'Banner Quick Access', path: '/quick-access-banners' },
            { icon: Laptop, label: 'Banner WFA', path: '/wfa-banners' },
        ]
    },
    {
        group: null,
        items: [
            { icon: Settings, label: 'Pengaturan', path: '/settings' },
        ]
    },
    {
        group: 'Sistem & Admin',
        adminOnly: true,
        items: [
            { icon: Users, label: 'Manajemen User', path: '/users' },
            { icon: ClipboardList, label: 'Log Aktivitas', path: '/audit-logs' },
        ]
    },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));
    const [bannerGroupOpen, setBannerGroupOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('grocries_auth');
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(path);
    };

    // Auto-open banner group if current page is inside it
    const bannerPaths = ADMIN_MENU[2].items.map(i => i.path);
    const isInBannerGroup = bannerPaths.some(p => location.pathname === p);
    const effectiveBannerOpen = bannerGroupOpen || isInBannerGroup;

    return (
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">U</div>
                <div>
                    <p className="font-bold text-sm text-gray-800 leading-none">UMKM Radar</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{auth.role} · {auth.name?.split(' ')[0] || '—'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
                {ADMIN_MENU.map((section, si) => {
                    // Filter items by role
                    const visibleItems = section.items.filter(item => {
                        if (item.role === 'admin' && auth.role !== 'admin') return false;
                        if (item.role === 'vendor' && auth.role !== 'vendor') return false;
                        return true;
                    });

                    // Skip whole section if adminOnly and not admin
                    if (section.adminOnly && auth.role !== 'admin') return null;
                    if (visibleItems.length === 0) return null;

                    // Banner group (collapsible)
                    if (section.collapsible) {
                        return (
                            <div key={si} className="mt-1">
                                {/* Group header — clickable toggle */}
                                <button
                                    onClick={() => setBannerGroupOpen(o => !o)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-colors ${effectiveBannerOpen ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{section.group}</span>
                                    {effectiveBannerOpen
                                        ? <ChevronDown size={13} />
                                        : <ChevronRight size={13} />}
                                </button>

                                {/* Items */}
                                {effectiveBannerOpen && (
                                    <div className="space-y-0.5 ml-1">
                                        {visibleItems.map(item => (
                                            <SidebarItem
                                                key={item.path}
                                                icon={item.icon}
                                                label={item.label}
                                                active={isActive(item.path)}
                                                onClick={() => navigate(item.path)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={si} className={si > 0 ? 'mt-1' : ''}>
                            {/* Section header */}
                            {section.group && (
                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{section.group}</p>
                            )}

                            {/* Divider before Settings */}
                            {si === ADMIN_MENU.length - 1 && (
                                <div className="border-t border-gray-100 my-2" />
                            )}

                            <div className="space-y-0.5">
                                {visibleItems.map(item => (
                                    <SidebarItem
                                        key={item.path}
                                        icon={item.icon}
                                        label={item.label}
                                        active={isActive(item.path)}
                                        onClick={() => navigate(item.path)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer — user info + logout */}
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors group"
                >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Keluar</span>
                </button>
            </div>
        </aside>
    );
}

function SidebarItem({ icon: Icon, label, active, badge, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
        >
            <div className="flex items-center gap-2.5">
                <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
                <span className="font-medium text-sm">{label}</span>
            </div>
            {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
            )}
        </button>
    );
}
