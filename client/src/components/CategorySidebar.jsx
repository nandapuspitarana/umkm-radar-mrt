import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Category icons data with routes
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', path: '/' },
    { id: 'publik', label: 'Publik', icon: '🛋️', path: '/publik' },
    { id: 'kuliner', label: 'Kuliner', icon: '🍳', path: '/kuliner' },
    { id: 'ngopi', label: 'Ngopi', icon: '☕', path: '/ngopi' },
    { id: 'wisata', label: 'Wisata', icon: '🏛️', path: '/wisata' },
    { id: 'atm', label: 'ATM & Belanja', icon: '🏪', path: '/atm' },
];

export default function CategorySidebar({ activeCategory }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active category from path or prop
    const currentActive = activeCategory ||
        categories.find(c => c.path === location.pathname)?.id ||
        'rekomen';

    const handleCategoryClick = (category) => {
        navigate(category.path);
    };

    // Gradient colors for active state based on category
    const getActiveGradient = (categoryId) => {
        switch (categoryId) {
            case 'rekomen':
                return 'bg-gradient-to-b from-red-400 to-white';
            case 'kuliner':
                return 'bg-gradient-to-b from-amber-400 to-white';
            case 'ngopi':
                return 'bg-gradient-to-b from-amber-600 to-white';
            case 'publik':
                return 'bg-gradient-to-b from-blue-400 to-white';
            case 'wisata':
                return 'bg-gradient-to-b from-teal-400 to-white';
            case 'atm':
                return 'bg-gradient-to-b from-blue-400 to-white';
            default:
                return 'bg-gradient-to-b from-red-400 to-white';
        }
    };

    return (
        <div className="flex flex-col gap-6 py-4 px-2 bg-white h-full w-20 flex-shrink-0">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="flex flex-col items-center gap-1.5 group"
                >
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${currentActive === category.id
                                ? `${getActiveGradient(category.id)} shadow-md`
                                : 'bg-transparent hover:bg-grey-100'
                            }`}
                    >
                        {category.icon}
                    </div>
                    <span
                        className={`text-xs font-semibold text-center leading-tight ${currentActive === category.id
                                ? 'text-grey-600'
                                : 'text-grey-600'
                            }`}
                    >
                        {category.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
