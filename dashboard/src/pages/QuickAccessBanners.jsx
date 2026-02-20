import React, { useState, useEffect } from 'react';
import {
    Plus, Save, Trash2, GripVertical, ExternalLink,
    Image as ImageIcon, Link, ChevronUp, ChevronDown, RefreshCw, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// ─── Default seed data — sesuai Home.jsx saat ini ────────────────────────────
const SEED_DATA = [
    {
        id: 'qa-1',
        title: 'Buat yang',
        subtitle: 'Belum Sarapan',
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=400&fit=crop',
        link: '',
        type: 'medium',
    },
    {
        id: 'qa-2',
        title: 'Butuh Ngopi',
        subtitle: 'Takeaway',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
        link: '',
        type: 'medium',
    },
    {
        id: 'qa-3',
        title: 'Parkir Seharian',
        subtitle: 'Tarif Flat',
        image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=400&fit=crop',
        link: '',
        type: 'medium',
    },
    {
        id: 'qa-4',
        title: 'Masjid/',
        subtitle: 'Mushala',
        image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&h=400&fit=crop',
        link: '',
        type: 'medium',
    },
    {
        id: 'qa-5',
        title: 'ATM & Topup',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=200&fit=crop',
        link: '',
        type: 'stacked',
        group: 1,
    },
    {
        id: 'qa-6',
        title: 'Minimarket',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=200&fit=crop',
        link: '',
        type: 'stacked',
        group: 1,
    },
    {
        id: 'qa-7',
        title: 'Charging HP',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
        link: '',
        type: 'stacked',
        group: 2,
    },
    {
        id: 'qa-8',
        title: 'Photocopy & ATK',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=200&fit=crop',
        link: '',
        type: 'stacked',
        group: 2,
    },
];

// ─── Banner Item Editor ───────────────────────────────────────────────────────
function BannerItem({ item, index, total, onChange, onDelete, onMove }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`bg-white rounded-2xl border-2 transition ${expanded ? 'border-blue-200' : 'border-gray-100'} overflow-hidden`}>
            {/* Collapsed Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={18} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.title || '(tanpa judul)'}</p>
                    <div className="flex items-center gap-2">
                        {item.subtitle && <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.type === 'stacked'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {item.type === 'stacked' ? `Stacked G${item.group ?? 1}` : 'Medium'}
                        </span>
                        {item.link && (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                                <Link size={10} /> Link
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
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Judul *</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={item.title}
                                onChange={e => onChange(index, 'title', e.target.value)}
                                placeholder="Contoh: Butuh Ngopi"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-judul</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={item.subtitle}
                                onChange={e => onChange(index, 'subtitle', e.target.value)}
                                placeholder="Contoh: Takeaway"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Kartu</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={item.type}
                                onChange={e => onChange(index, 'type', e.target.value)}
                            >
                                <option value="medium">Medium (200×200)</option>
                                <option value="stacked">Stacked (200×97)</option>
                            </select>
                        </div>
                        {item.type === 'stacked' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Grup Stacked</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={item.group ?? 1}
                                    onChange={e => onChange(index, 'group', parseInt(e.target.value))}
                                >
                                    <option value={1}>Grup 1</option>
                                    <option value={2}>Grup 2</option>
                                    <option value={3}>Grup 3</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Link Redirect (opsional)
                        </label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={item.link}
                                onChange={e => onChange(index, 'link', e.target.value)}
                                placeholder="https://... atau /kuliner"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Foto Banner</label>
                        <ImageUploader
                            value={item.image}
                            onChange={url => onChange(index, 'image', url)}
                            category="banner"
                            placeholder="Upload foto banner"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuickAccessBanners() {
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
            if (data.quick_access_banners && Array.isArray(data.quick_access_banners) && data.quick_access_banners.length > 0) {
                setItems(data.quick_access_banners);
            } else {
                // Load seed data if empty
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
        if (!window.confirm('Hapus item ini?')) return;
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
        const newItem = {
            id: `qa-${Date.now()}`,
            title: '',
            subtitle: '',
            image: '',
            link: '',
            type: 'medium',
            group: 1,
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleLoadSeed = () => {
        if (!window.confirm('Reset ke data default? Semua perubahan akan hilang.')) return;
        setItems(SEED_DATA);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'quick_access_banners', value: items }),
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

    // Preview grouping
    const mediumItems = items.filter(i => i.type === 'medium');
    const stackedGroups = [...new Set(items.filter(i => i.type === 'stacked').map(i => i.group ?? 1))].sort();

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Banner Butuh Cepat & Dekat</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola kartu di section "Butuh Cepat Dan Dekat" pada halaman Home.
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
                            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 font-medium text-sm transition"
                        >
                            <Plus size={16} />
                            Tambah Item
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition shadow-lg ${saved
                                    ? 'bg-green-600 text-white shadow-green-600/20'
                                    : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                                } disabled:opacity-50`}
                        >
                            <Save size={16} />
                            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan'}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left: Editor */}
                        <div className="col-span-2 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">
                                    {items.length} item — urutkan dengan ↑↓
                                </p>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">Belum ada item</p>
                                    <button
                                        onClick={handleAdd}
                                        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        + Tambah item pertama
                                    </button>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <BannerItem
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
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-hidden">
                                    <p className="text-xs font-bold text-gray-800 mb-2">Butuh Cepat Dan Dekat</p>

                                    {/* Preview Grid */}
                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                        {/* Medium cards */}
                                        {mediumItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="w-[80px] h-[80px] rounded-lg overflow-hidden flex-shrink-0 relative"
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon size={16} className="text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                                                <p className="absolute bottom-1 left-1 right-1 text-white text-[8px] font-bold leading-tight">
                                                    {item.title}
                                                </p>
                                            </div>
                                        ))}

                                        {/* Stacked groups */}
                                        {stackedGroups.map(grp => {
                                            const grpItems = items.filter(i => i.type === 'stacked' && (i.group ?? 1) === grp);
                                            return (
                                                <div key={grp} className="flex flex-col gap-1 w-[80px] h-[80px] flex-shrink-0">
                                                    {grpItems.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="flex-1 rounded-lg overflow-hidden relative"
                                                        >
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                    <ImageIcon size={10} className="text-gray-300" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                                                            <p className="absolute bottom-0.5 left-0.5 right-0.5 text-white text-[7px] font-bold leading-tight">
                                                                {item.title}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {items.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-4">
                                            (kosong)
                                        </p>
                                    )}
                                </div>

                                {/* Tips */}
                                <div className="mt-4 p-4 bg-blue-50 rounded-2xl text-xs text-blue-700 space-y-1.5">
                                    <p className="font-bold">💡 Tips:</p>
                                    <p>• <b>Medium</b> = kartu besar 200×200px (standalone)</p>
                                    <p>• <b>Stacked</b> = kartu kecil 200×97px yang ditumpuk dalam grup</p>
                                    <p>• Maksimal 2 item per grup stacked</p>
                                    <p>• Urutan di sini = urutan tampil di Home</p>
                                    <p>• Link bisa berupa URL atau path (e.g., <code className="bg-blue-100 px-1 rounded">/kuliner</code>)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
