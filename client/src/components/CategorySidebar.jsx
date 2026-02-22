import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Fallback hardcoded — dipakai bila API belum diset
const FALLBACK_MENU = [
    { id: 'rekomen', label: 'Rekomen', path: '/', svgPath: 'logo/1770871772731-a529bdeb385aa123.svg', color: 'from-red-400' },
    { id: 'publik', label: 'Publik', path: '/publik', svgPath: 'logo/1770871919071-e53b8faf71ab40a1.svg', color: 'from-blue-400' },
    { id: 'kuliner', label: 'Kuliner', path: '/kuliner', svgPath: 'logo/1770871967519-646c77da94660157.svg', color: 'from-amber-400' },
    { id: 'ngopi', label: 'Ngopi', path: '/ngopi', svgPath: 'logo/1770872009104-0e2cddbda4e360c3.svg', color: 'from-amber-600' },
    { id: 'wisata', label: 'Wisata', path: '/wisata', svgPath: 'logo/1770872135119-8992ba618988025c.svg', color: 'from-teal-400' },
    { id: 'atm', label: 'ATM & Belanja', path: '/atm', svgPath: 'logo/1770872210180-6a935e4293a50f53.svg', color: 'from-blue-400' },
];

// Simple in-memory cache so we don't re-fetch on every render
let _cachedMenu = null;

export default function CategorySidebar({ activeCategory }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuItems, setMenuItems] = useState(_cachedMenu || FALLBACK_MENU);

    // Fetch custom menu from settings (once per session)
    useEffect(() => {
        if (_cachedMenu) return; // already fetched

        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data.main_menu) && data.main_menu.length > 0) {
                    const active = data.main_menu.filter(i => i.isActive !== false);
                    _cachedMenu = active;
                    setMenuItems(active);
                } else {
                    _cachedMenu = FALLBACK_MENU;
                }
            })
            .catch(() => {
                _cachedMenu = FALLBACK_MENU;
            });
    }, []);

    const activeItems = menuItems.filter(i => i.isActive !== false);

    const currentActive =
        activeCategory ||
        activeItems.find(c => c.path !== '/' && location.pathname.startsWith(c.path))?.id ||
        (location.pathname === '/' ? 'rekomen' : null);

    const getGradient = (item) => item.color
        ? `bg-gradient-to-b ${item.color} to-white`
        : 'bg-gradient-to-b from-red-400 to-white';

    return (
        <div className="flex flex-col gap-6 py-4 px-2 bg-white h-full w-20 flex-shrink-0">
            {activeItems.map((item) => {
                const isActive = currentActive === item.id;
                const svgUrl = item.svgPath
                    ? `/api/raw/${item.svgPath.replace(/^\//, '')}`
                    : null;

                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <div className={`w-[50px] h-[50px] rounded-t-2xl flex items-center justify-center transition-all ${isActive
                                ? getGradient(item)
                                : 'bg-transparent hover:bg-grey-100 hover:rounded-t-2xl'
                            }`}>
                            {svgUrl ? (
                                <img
                                    src={svgUrl}
                                    alt={item.label}
                                    className="w-[38px] h-[38px] object-contain"
                                    onError={e => { e.target.style.opacity = '0.4'; }}
                                />
                            ) : (
                                <span className="text-2xl">{item.icon || '•'}</span>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-grey-600 text-center leading-tight">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
