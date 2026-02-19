import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../utils/api';

// Category icons data with routes
const categories = [
    {
        id: 'rekomen',
        label: 'Rekomen',
        // Using uploaded SVG logo for Rekomen
        icon: <img
            src={getImageUrl('logo/1770871772731-a529bdeb385aa123.svg')}
            alt="Rekomen"
            className="w-[38px] h-[38px] object-contain"
        />,
        path: '/'
    },
    {
        id: 'publik',
        label: 'Publik',
        icon: <img src={getImageUrl('logo/1770871919071-e53b8faf71ab40a1.svg')} alt="Publik" className="w-[38px] h-[38px] object-contain" />,
        path: '/publik'
    },
    {
        id: 'kuliner',
        label: 'Kuliner',
        icon: <img src={getImageUrl('logo/1770871967519-646c77da94660157.svg')} alt="Kuliner" className="w-[38px] h-[38px] object-contain" />,
        path: '/kuliner'
    },
    {
        id: 'ngopi',
        label: 'Ngopi',
        icon: <img src={getImageUrl('logo/1770872009104-0e2cddbda4e360c3.svg')} alt="Ngopi" className="w-[38px] h-[38px] object-contain" />,
        path: '/ngopi'
    },
    {
        id: 'wisata',
        label: 'Wisata',
        icon: <img src={getImageUrl('logo/1770872135119-8992ba618988025c.svg')} alt="Wisata" className="w-[38px] h-[38px] object-contain" />,
        path: '/wisata'
    },
    {
        id: 'atm',
        label: 'ATM & Belanja',
        icon: <img src={getImageUrl('logo/1770872210180-6a935e4293a50f53.svg')} alt="ATM" className="w-[38px] h-[38px] object-contain" />,
        path: '/atm'
    },
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
                        className={`w-[50px] h-[50px] rounded-t-2xl flex items-center justify-center text-2xl transition-all ${currentActive === category.id
                            ? getActiveGradient(category.id)
                            : 'bg-transparent hover:bg-grey-100 hover:rounded-t-2xl'
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
