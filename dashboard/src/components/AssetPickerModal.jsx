import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, FolderOpen, Check, Filter, Grid, List } from 'lucide-react';

/**
 * AssetPickerModal – Browse & pick a file from Asset Management (MinIO)
 *
 * Props:
 *   open       {boolean}  – show/hide modal
 *   onClose    {function} – called when user closes without picking
 *   onSelect   {function} – called with the relative URL of the chosen asset
 *   filterType {string}   – 'image' | 'video' | '' (all)
 */
export default function AssetPickerModal({ open, onClose, onSelect, filterType = 'image' }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedId, setSelectedId] = useState(null);

    const CATEGORIES = [
        { value: '', label: 'Semua' },
        { value: 'banners', label: 'Banner' },
        { value: 'logo', label: 'Logo' },
        { value: 'product', label: 'Produk' },
        { value: 'general', label: 'Umum' },
    ];

    // Strip domain → relative path
    const toRelative = (url) => {
        if (!url) return '';
        try {
            const u = new URL(url);
            return u.pathname + u.search + u.hash;
        } catch {
            return url.startsWith('/') ? url : '/' + url;
        }
    };

    const isVideo = (url) => /\.(mp4|webm|mov)/i.test(url || '');

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const qs = category ? `?category=${category}` : '';
            const res = await fetch(`/api/assets${qs}`);
            const data = await res.json();
            setAssets(Array.isArray(data) ? data : []);
        } catch {
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        if (open) {
            fetchAssets();
            setSelectedId(null);
            setSearch('');
        }
    }, [open, fetchAssets]);

    if (!open) return null;

    // Filter by search & type
    const filtered = assets.filter((a) => {
        const matchSearch = !search || a.filename?.toLowerCase().includes(search.toLowerCase());
        const matchType =
            !filterType ||
            (filterType === 'image' && !isVideo(a.storagePath)) ||
            (filterType === 'video' && isVideo(a.storagePath));
        return matchSearch && matchType;
    });

    const handlePick = () => {
        const asset = assets.find((a) => a.id === selectedId);
        if (asset) {
            onSelect(toRelative(asset.directUrl));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Pilih dari Asset Manager</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Klik gambar lalu tekan Pilih</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 shrink-0 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama file..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Filter size={14} className="text-gray-400 shrink-0" />
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* View Mode */}
                    <div className="flex gap-1 ml-auto shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>

                {/* Asset Grid / List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <FolderOpen size={40} className="mb-2 opacity-50" />
                            <p className="text-sm">Tidak ada aset ditemukan</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {filtered.map((asset) => (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedId(asset.id)}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedId === asset.id
                                            ? 'border-blue-500 ring-2 ring-blue-200 scale-95'
                                            : 'border-transparent hover:border-gray-300 hover:scale-95'
                                        }`}
                                >
                                    {isVideo(asset.storagePath) ? (
                                        <video
                                            src={asset.directUrl}
                                            className="w-full h-full object-cover bg-gray-900"
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={asset.directUrl}
                                            alt={asset.filename}
                                            className="w-full h-full object-cover bg-gray-100"
                                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                                        />
                                    )}
                                    {selectedId === asset.id && (
                                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                            <div className="bg-blue-600 rounded-full p-1">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                                        <p className="text-white text-[9px] truncate leading-tight">{asset.filename}</p>
                                        <p className="text-white/60 text-[8px]">{asset.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            {filtered.map((asset, idx) => (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedId(asset.id)}
                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${idx !== filtered.length - 1 ? 'border-b border-gray-50' : ''
                                        } ${selectedId === asset.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                                        {isVideo(asset.storagePath) ? (
                                            <video src={asset.directUrl} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <img
                                                src={asset.directUrl}
                                                alt={asset.filename}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = '/placeholder.png'; }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{asset.filename}</p>
                                        <p className="text-xs text-gray-400 truncate">{toRelative(asset.directUrl)}</p>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                                        {asset.category}
                                    </span>
                                    {selectedId === asset.id && (
                                        <div className="bg-blue-600 rounded-full p-1 shrink-0">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <p className="text-sm text-gray-500">
                        {filtered.length} aset ditemukan
                        {selectedId && (
                            <span className="ml-2 text-blue-600 font-medium">
                                · 1 dipilih
                            </span>
                        )}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handlePick}
                            disabled={!selectedId}
                            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedId
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Pilih Gambar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
