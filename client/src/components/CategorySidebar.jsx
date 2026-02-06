import React from 'react';

// Category icons data
const categories = [
    { id: 'rekomen', label: 'Rekomen', icon: '📢', active: true },
    { id: 'publik', label: 'Publik', icon: '🛋️', active: false },
    { id: 'kuliner', label: 'Kuliner', icon: '🍳', active: false },
    { id: 'ngopi', label: 'Ngopi', icon: '☕', active: false },
    { id: 'wisata', label: 'Wisata', icon: '🏛️', active: false },
    { id: 'atm', label: 'ATM & Belanja', icon: '🏪', active: false },
];

export default function CategorySidebar({ activeCategory, onCategoryChange }) {
    return (
        <div className="flex flex-col gap-6 py-4 px-2 bg-white h-full w-20 flex-shrink-0">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className="flex flex-col items-center gap-1.5 group"
                >
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${activeCategory === category.id
                                ? 'bg-gradient-to-b from-red-400 to-white shadow-md'
                                : 'bg-transparent hover:bg-grey-100'
                            }`}
                    >
                        {category.icon}
                    </div>
                    <span
                        className={`text-xs font-semibold text-center leading-tight ${activeCategory === category.id
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
