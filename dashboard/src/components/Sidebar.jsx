import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
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
    Landmark
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));
    const [stats, setStats] = useState({ pending: 0 }); // Fetch real stats later

    const handleLogout = () => {
        localStorage.removeItem('grocries_auth');
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">G</div>
                <span className="font-serif font-bold text-xl text-blue-800">UMKM Radar</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Menu</div>
                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Overview"
                    active={location.pathname === '/'}
                    onClick={() => navigate('/')}
                />

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Store size={20} />}
                        label="Mitra & Lokasi"
                        active={location.pathname === '/vendors'}
                        onClick={() => navigate('/vendors')}
                    />
                )}

                {auth.role === 'vendor' && (
                    <SidebarItem
                        icon={<Package size={20} />}
                        label="Produk saya"
                        active={location.pathname === '/products'}
                        onClick={() => navigate('/products')}
                    />
                )}

                <SidebarItem
                    icon={<Ticket size={20} />}
                    label="Voucher & Promo"
                    active={location.pathname === '/vouchers'}
                    onClick={() => navigate('/vouchers')}
                />

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Image size={20} />}
                        label="Assets"
                        active={location.pathname === '/assets'}
                        onClick={() => navigate('/assets')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Tag size={20} />}
                        label="Kategori"
                        active={location.pathname === '/categories'}
                        onClick={() => navigate('/categories')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Navigation2 size={20} />}
                        label="Navigasi"
                        active={location.pathname === '/navigation'}
                        onClick={() => navigate('/navigation')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<MapPin size={20} />}
                        label="Destinations"
                        active={location.pathname === '/destinations'}
                        onClick={() => navigate('/destinations')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<FileImage size={20} />}
                        label="Banner Publik"
                        active={location.pathname === '/publik-banner'}
                        onClick={() => navigate('/publik-banner')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<CreditCard size={20} />}
                        label="Banner ATM"
                        active={location.pathname === '/atm-banners'}
                        onClick={() => navigate('/atm-banners')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Utensils size={20} />}
                        label="Banner Kuliner"
                        active={location.pathname === '/kuliner-banners'}
                        onClick={() => navigate('/kuliner-banners')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Coffee size={20} />}
                        label="Banner Ngopi"
                        active={location.pathname === '/ngopi-banners'}
                        onClick={() => navigate('/ngopi-banners')}
                    />
                )}

                {auth.role === 'admin' && (
                    <SidebarItem
                        icon={<Landmark size={20} />}
                        label="Banner Wisata"
                        active={location.pathname === '/wisata-banner'}
                        onClick={() => navigate('/wisata-banner')}
                    />
                )}

                <SidebarItem
                    icon={<Settings size={20} />}
                    label="Pengaturan"
                    active={location.pathname === '/settings'}
                    onClick={() => navigate('/settings')}
                />
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 px-4 py-3 mb-2 w-full text-left hover:bg-gray-50 rounded-xl transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                        {/* We can try to show image if available in auth, else fallback */}
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                            {auth.name ? auth.name[0] : 'U'}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-gray-700 group-hover:text-blue-700 transition-colors">{auth.name || auth.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{auth.role}</p>
                    </div>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Keluar</span>
                </button>
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, active, badge, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </div>
            {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
            )}
        </button>
    );
}
