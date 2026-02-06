import React, { useState } from 'react';
import { ArrowLeft, Search, Star, MessageCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Vendor({ vendor, products, onBack, onAddToCart, cart }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');

    const categories = ['Semua', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-bg pb-24">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    {vendor.image && (
                        <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                            <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-lg text-gray-800 leading-tight truncate max-w-[200px]">{vendor.name}</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Star size={10} className="text-orange-500 fill-orange-500" />
                            {vendor.rating} • {vendor.address}
                        </p>
                        {/* Status Check Logic */}
                        {(() => {
                            const schedule = vendor.schedule;
                            if (!schedule) return null;
                            const now = new Date();
                            const day = now.getDay();
                            const hours = now.getHours();
                            const minutes = now.getMinutes();
                            const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                            let isOpen = true;
                            let text = 'Buka';
                            let color = 'text-green-600';

                            if (schedule.days && !schedule.days.includes(day)) {
                                isOpen = false; text = 'Tutup (Hari Libur)'; color = 'text-red-500';
                            } else if (schedule.openTime && schedule.closeTime) {
                                if (currentTime < schedule.openTime || currentTime > schedule.closeTime) {
                                    isOpen = false; text = 'Tutup'; color = 'text-red-500';
                                }
                            }

                            return (
                                <p className={`text-xs font-bold ${color}`}>
                                    {text} {(!isOpen && schedule.openTime) && `• Buka ${schedule.openTime}`}
                                </p>
                            )
                        })()}
                    </div>
                </div>

                {/* Filter Scroller */}
                <div className="max-w-md mx-auto px-4 pb-3 overflow-x-auto no-scrollbar flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-md shadow-green-900/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Product Grid */}
            <main className="max-w-md mx-auto px-4 py-6">
                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col h-full">
                            <div className="aspect-square rounded-xl bg-gray-100 mb-3 relative overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                {/* Wishlist Btn could go here */}
                            </div>

                            <div className="flex-1 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">{product.category}</span>
                                <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-2">{product.name}</h3>

                                <div className="mt-auto flex items-center justify-between pt-3">
                                    <div>
                                        {product.discountPrice ? (
                                            <>
                                                <div className="font-serif font-bold text-red-600">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.discountPrice)}
                                                </div>
                                                <div className="text-[10px] text-gray-400 line-through">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="font-serif font-bold text-primary">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onAddToCart(product)}
                                        className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div >
                    ))
                    }
                </div >

                {
                    filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <p>Produk tidak ditemukan.</p>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
