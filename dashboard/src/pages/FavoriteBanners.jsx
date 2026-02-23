import React, { useState, useEffect } from 'react';
import {
    Plus, Save, Trash2, GripVertical, ExternalLink,
    Image as ImageIcon, MapPin, ChevronUp, ChevronDown, RefreshCw, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// ─── Default seed data — sesuai Home.jsx saat ini ────────────────────────────
const SEED_DATA = [
    {
        id: 'fp-1',
        title: 'GBK (Gelora\nBung Karno)',
        distance: '300 m',
        image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'fp-2',
        title: 'FX Sudirman',
        distance: '150 m',
        image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'fp-3',
        title: 'Plaza Senayan',
        distance: '700 m',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'fp-4',
        title: 'Senayan City',
        distance: '900 m',
        image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'fp-5',
        title: 'Senayan Park',
        distance: '1.2 km',
        image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop',
        link: '',
    },
];

// ─── Favorite Item Editor ─────────────────────────────────────────────────────
function FavoriteItem({ item, index, total, onChange, onDelete, onMove }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`bg-white rounded-2xl border-2 transition ${expanded ? 'border-rose-200' : 'border-gray-100'} overflow-hidden`}>
            {/* Collapsed Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={18} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.title?.replace(/\n/g, ' ') || '(tanpa judul)'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {item.distance && (
                            <span className="text-xs text-rose-500 flex items-center gap-0.5 font-medium">
                                <MapPin size={10} /> {item.distance}
                            </span>
                        )}
                        {item.link && (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                                <ExternalLink size={10} /> Link
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        onClick={() => onMove(index, 1)}
                        disabled={index === total - 1}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition"
                    >
                        <ChevronDown size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(index)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className={`ml-1 p-1.5 text-gray-400 transition ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            {/* Expanded Form */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Tempat *</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                                value={item.title}
                                onChange={e => onChange(index, 'title', e.target.value)}
                                placeholder="Contoh: GBK (Gelora Bung Karno)"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Judul bisa mengandung Enter (\n) untuk baris baru</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jarak dari Stasiun</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                <input
                                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                                    value={item.distance}
                                    onChange={e => onChange(index, 'distance', e.target.value)}
                                    placeholder="Contoh: 300 m atau 1.2 km"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Link Redirect (opsional)
                        </label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                                value={item.link}
                                onChange={e => onChange(index, 'link', e.target.value)}
                                placeholder="https://... atau /destinasi/123"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Foto Tempat</label>
                        <ImageUploader
                            value={item.image}
                            onChange={url => onChange(index, 'image', url)}
                            category="banner"
                            placeholder="Upload foto tempat favorit"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FavoriteBanners() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.favorite_places && Array.isArray(data.favorite_places) && data.favorite_places.length > 0) {
                setItems(data.favorite_places);
            } else {
                setItems(SEED_DATA);
            }
        } catch (err) {
            console.error(err);
            setItems(SEED_DATA);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleDelete = (index) => {
        if (!window.confirm('Hapus tempat ini?')) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleMove = (index, dir) => {
        setItems(prev => {
            const next = [...prev];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleAdd = () => {
        setItems(prev => [...prev, {
            id: `fp-${Date.now()}`,
            title: '',
            distance: '',
            image: '',
            link: '',
        }]);
    };

    const handleLoadSeed = () => {
        if (!window.confirm('Reset ke data default? Semua perubahan akan hilang.')) return;
        setItems(SEED_DATA);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favorite_places: items }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Gagal menyimpan');
            }
        } catch (err) {
            alert('Error koneksi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Banner Tempat Favorit</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola kartu tempat di section "Tempat Favorit" pada halaman Home.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLoadSeed}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition"
                        >
                            <RefreshCw size={16} />
                            Reset Default
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 font-medium text-sm transition"
                        >
                            <Plus size={16} />
                            Tambah Tempat
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition shadow-lg ${saved
                                ? 'bg-green-600 text-white shadow-green-600/20'
                                : 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {saving
                                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                                : <><Save size={16} /> {saved ? '✓ Tersimpan!' : 'Simpan'}</>
                            }
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left: Editor */}
                        <div className="col-span-2 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">
                                    {items.length} tempat — urutkan dengan ↑↓
                                </p>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <MapPin size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">Belum ada tempat favorit</p>
                                    <button
                                        onClick={handleAdd}
                                        className="mt-3 text-rose-600 text-sm font-medium hover:underline"
                                    >
                                        + Tambah tempat pertama
                                    </button>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <FavoriteItem
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        total={items.length}
                                        onChange={handleChange}
                                        onDelete={handleDelete}
                                        onMove={handleMove}
                                    />
                                ))
                            )}
                        </div>

                        {/* Right: Live Preview */}
                        <div className="col-span-1">
                            <div className="sticky top-8">
                                <p className="text-sm font-bold text-gray-600 mb-3">Preview Section</p>
                                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <p className="text-xs font-bold text-gray-800 mb-3">Tempat Favorit</p>

                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {items.map(item => (
                                            <div
                                                key={item.id}
                                                className="w-[100px] flex-shrink-0"
                                            >
                                                <div className="w-[100px] h-[75px] rounded-xl overflow-hidden bg-gray-100 relative mb-1">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon size={16} className="text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-gray-800 leading-tight line-clamp-2">
                                                    {item.title?.replace(/\n/g, ' ') || '—'}
                                                </p>
                                                {item.distance && (
                                                    <p className="text-[8px] text-rose-500 font-medium flex items-center gap-0.5 mt-0.5">
                                                        <MapPin size={7} /> {item.distance}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        {items.length === 0 && (
                                            <p className="text-xs text-gray-400 py-4">(kosong)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="mt-4 p-4 bg-rose-50 rounded-2xl text-xs text-rose-700 space-y-1.5">
                                    <p className="font-bold">💡 Tips:</p>
                                    <p>• Foto landscape <b>4:3</b> terlihat terbaik (e.g. 400×300px)</p>
                                    <p>• Jarak diisi manual sesuai stasiun terdekat</p>
                                    <p>• Judul bisa pakai baris baru dengan <code className="bg-rose-100 px-1 rounded">\n</code></p>
                                    <p>• Link bisa ke halaman destinasi atau URL eksternal</p>
                                    <p>• Urutan di sini = urutan tampil di Home</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
