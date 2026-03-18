import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Package,
    Ticket,
    Store,
    MapPin,
    CreditCard,
    Utensils,
    Coffee,
    Landmark,
    LayoutGrid,
    Train,
    Bus,
    Layers,
    Users,
    ClipboardList,
    ChevronDown,
    ChevronRight,
    Heart,
    Star,
    Globe,
    Zap,
    Briefcase,
    FolderOpen,
} from 'lucide-react';

// ─── Menu config ───────────────────────────────────────────────────────────────
const ADMIN_MENU = [
    {
        group: null,
        items: [
            { icon: LayoutDashboard, label: 'Overview', path: '/' },
            { icon: Store, label: 'Mitra & Lokasi', path: '/vendors', role: 'admin' },
            { icon: Package, label: 'Produk Saya', path: '/products', role: 'vendor' },
            { icon: Ticket, label: 'Voucher & Promo', path: '/vouchers' },
        ],
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
            { icon: FolderOpen, label: 'Asset Manager', path: '/assets' },
        ],
    },
    {
        group: 'Banner Homepage',
        adminOnly: true,
        collapsible: true,
        groupKey: 'homepage',
        items: [
            { icon: Zap, label: 'Quick Access', path: '/quick-access-banners' },
            { icon: Briefcase, label: 'WFA', path: '/wfa-banners' },
            { icon: Heart, label: 'Tempat Favorit', path: '/favorite-banners' },
            { icon: Star, label: 'Rekomendasi', path: '/rekomen-banners' },
        ],
    },
    {
        group: 'Banner Kategori',
        adminOnly: true,
        collapsible: true,
        groupKey: 'kategori',
        items: [
            { icon: Globe, label: 'Story / Publik', path: '/publik-banner' },
            { icon: CreditCard, label: 'ATM', path: '/atm-banners' },
            { icon: Utensils, label: 'Kuliner', path: '/kuliner-banners' },
            { icon: Coffee, label: 'Sarapan', path: '/sarapan-banners' },
            { icon: Coffee, label: 'Ngopi', path: '/ngopi-banners' },
            { icon: Landmark, label: 'Wisata', path: '/wisata-banner' },
        ],
    },
    {
        group: null,
        dividerBefore: true,
        items: [
            { icon: Settings, label: 'Pengaturan', path: '/settings' },
        ],
    },
    {
        group: 'Sistem & Admin',
        adminOnly: true,
        items: [
            { icon: Users, label: 'Manajemen User', path: '/users' },
            { icon: ClipboardList, label: 'Log Aktivitas', path: '/audit-logs' },
        ],
    },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));

    // Track open state per group key
    const [openGroups, setOpenGroups] = useState({});
    const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(path);
    };

    // Helper: is the current path inside this section's items?
    const isGroupActive = (items) => items.some(i => isActive(i.path));

    const isGroupOpen = (section) => {
        const key = section.groupKey;
        // Explicitly toggled OR current route is inside this group
        return openGroups[key] !== undefined
            ? openGroups[key]
            : isGroupActive(section.items);
    };

    return (
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">

            {/* ── Logo ── */}
            <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
                    U
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-800 leading-none">UMKM Radar</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                        {auth.role} · {auth.name?.split(' ')[0] || '—'}
                    </p>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
                {ADMIN_MENU.map((section, si) => {
                    const visibleItems = section.items.filter(item => {
                        if (item.role === 'admin' && auth.role !== 'admin') return false;
                        if (item.role === 'vendor' && auth.role !== 'vendor') return false;
                        return true;
                    });

                    if (section.adminOnly && auth.role !== 'admin') return null;
                    if (visibleItems.length === 0) return null;

                    // ── Collapsible group ────────────────────────────────────
                    if (section.collapsible) {
                        const expanded = isGroupOpen(section);
                        const hasActive = isGroupActive(visibleItems);

                        return (
                            <div key={si} className="mt-1">
                                <button
                                    onClick={() => toggleGroup(section.groupKey)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${expanded || hasActive
                                        ? 'text-blue-600 bg-blue-50/70'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {section.group}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${expanded || hasActive
                                            ? 'bg-blue-100 text-blue-500'
                                            : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {visibleItems.length}
                                        </span>
                                        {expanded
                                            ? <ChevronDown size={13} />
                                            : <ChevronRight size={13} />}
                                    </div>
                                </button>

                                {expanded && (
                                    <div className="mt-1 mx-1 rounded-xl bg-blue-50/40 py-1 px-1">
                                        <div className="border-l-[3px] border-blue-200 pl-2 space-y-0.5">
                                            {visibleItems.map(item => (
                                                <SidebarItem
                                                    key={item.path}
                                                    icon={item.icon}
                                                    label={item.label}
                                                    active={isActive(item.path)}
                                                    compact
                                                    onClick={() => navigate(item.path)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // ── Regular section ──────────────────────────────────────
                    return (
                        <div key={si} className={si > 0 ? 'mt-1' : ''}>
                            {section.dividerBefore && (
                                <div className="border-t border-gray-100 my-2" />
                            )}
                            {section.group && (
                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {section.group}
                                </p>
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

            {/* ── Footer / logout ── */}
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={() => {
                        localStorage.removeItem('grocries_auth');
                        navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Keluar</span>
                </button>
            </div>
        </aside>
    );
}

// ─── SidebarItem ───────────────────────────────────────────────────────────────
function SidebarItem({ icon: Icon, label, active, badge, compact = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between rounded-lg transition-all text-left ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
                } ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
        >
            <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'}`}>
                <Icon
                    size={compact ? 13 : 16}
                    className={active ? 'text-blue-600' : 'text-gray-400'}
                />
                <span className={`font-medium ${compact ? 'text-[13px]' : 'text-sm'}`}>
                    {label}
                </span>
            </div>
            {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {badge}
                </span>
            )}
        </button>
    );
}
