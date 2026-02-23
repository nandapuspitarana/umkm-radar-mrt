import React, { useState, useEffect } from 'react';
import {
    Plus, Save, Trash2, GripVertical, ExternalLink,
    Image as ImageIcon, ChevronUp, ChevronDown, RefreshCw, Loader2, Star
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// ─── Default seed data ────────────────────────────────────────────────────────
const SEED_DATA = [
    {
        id: 'rek-1',
        title: 'Kuliner Hits',
        subtitle: 'Sekitar Stasiun',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
        link: '/kuliner',
    },
    {
        id: 'rek-2',
        title: 'Ngopi Santai',
        subtitle: 'Sambil Nunggu',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        link: '/ngopi',
    },
    {
        id: 'rek-3',
        title: 'Wisata Dekat',
        subtitle: 'MRT Terdekat',
        image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop',
        link: '/wisata',
    },
    {
        id: 'rek-4',
        title: 'Tempat Publik',
        subtitle: 'Fasilitas Umum',
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
        link: '/publik',
    },
];

// ─── Banner Item Editor ───────────────────────────────────────────────────────
function BannerItem({ item, index, total, onChange, onDelete, onMove }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`bg-white rounded-2xl border-2 transition ${expanded ? 'border-amber-200' : 'border-gray-100'} overflow-hidden`}>
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
                    <p className="font-bold text-gray-800 text-sm truncate">{item.title || '(tanpa judul)'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {item.subtitle && <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>}
                        {item.link && (
                            <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                                <ExternalLink size={10} /> Link
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onMove(index, -1)} disabled={index === 0}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition">
                        <ChevronUp size={14} />
                    </button>
                    <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
                        className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition">
                        <ChevronDown size={14} />
                    </button>
                    <button onClick={() => onDelete(index)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
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
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                                value={item.title}
                                onChange={e => onChange(index, 'title', e.target.value)}
                                placeholder="Contoh: Kuliner Hits"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-judul</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                                value={item.subtitle}
                                onChange={e => onChange(index, 'subtitle', e.target.value)}
                                placeholder="Contoh: Sekitar Stasiun"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Link Redirect (opsional)</label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
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
                            placeholder="Upload foto banner rekomendasi"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RekomenBanners() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.rekomen_banners && Array.isArray(data.rekomen_banners) && data.rekomen_banners.length > 0) {
                setItems(data.rekomen_banners);
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

    const handleChange = (index, field, value) =>
        setItems(prev => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });

    const handleDelete = (index) => {
        if (!window.confirm('Hapus item ini?')) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleMove = (index, dir) => {
        setItems(prev => {
            const n = [...prev];
            const t = index + dir;
            if (t < 0 || t >= n.length) return prev;
            [n[index], n[t]] = [n[t], n[index]];
            return n;
        });
    };

    const handleAdd = () => setItems(prev => [...prev, {
        id: `rek-${Date.now()}`, title: '', subtitle: '', image: '', link: '',
    }]);

    const handleLoadSeed = () => {
        if (!window.confirm('Reset ke data default?')) return;
        setItems(SEED_DATA);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rekomen_banners: items }),
            });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
            else alert('Gagal menyimpan');
        } catch { alert('Error koneksi'); }
        finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Banner Rekomendasi Lainnya</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola kartu di section "Rekomendasi Lainnya" pada halaman Home.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleLoadSeed}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition">
                            <RefreshCw size={16} /> Reset Default
                        </button>
                        <button onClick={handleAdd}
                            className="flex items-center gap-2 px-4 py-2 border border-amber-200 text-amber-600 rounded-xl hover:bg-amber-50 font-medium text-sm transition">
                            <Plus size={16} /> Tambah Item
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition shadow-lg ${saved
                                ? 'bg-green-600 text-white shadow-green-600/20'
                                : 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                                : <><Save size={16} /> {saved ? '✓ Tersimpan!' : 'Simpan'}</>}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Editor */}
                        <div className="col-span-2 space-y-3">
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                {items.length} item — urutkan dengan ↑↓
                            </p>
                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <Star size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">Belum ada rekomendasi</p>
                                    <button onClick={handleAdd} className="mt-3 text-amber-600 text-sm font-medium hover:underline">
                                        + Tambah item pertama
                                    </button>
                                </div>
                            ) : items.map((item, index) => (
                                <BannerItem key={item.id} item={item} index={index} total={items.length}
                                    onChange={handleChange} onDelete={handleDelete} onMove={handleMove} />
                            ))}
                        </div>

                        {/* Preview */}
                        <div className="col-span-1">
                            <div className="sticky top-8">
                                <p className="text-sm font-bold text-gray-600 mb-3">Preview Section</p>
                                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <p className="text-xs font-bold text-gray-800 mb-3">Rekomendasi Lainnya</p>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {items.map(item => (
                                            <div key={item.id} className="flex-shrink-0 w-[96px]">
                                                <div className="w-[96px] h-[72px] rounded-xl overflow-hidden bg-gray-100 relative mb-1">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover"
                                                            onError={e => e.target.style.display = 'none'} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon size={16} className="text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                                                    <div className="absolute bottom-1 left-1 right-1">
                                                        <p className="text-white text-[8px] font-bold leading-tight">{item.title || '—'}</p>
                                                        {item.subtitle && <p className="text-gray-300 text-[7px] leading-tight">{item.subtitle}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {items.length === 0 && <p className="text-xs text-gray-400 py-4">(kosong)</p>}
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs text-amber-700 space-y-1.5">
                                    <p className="font-bold">💡 Tips:</p>
                                    <p>• Gunakan foto landscape <b>4:3</b> (400×300px)</p>
                                    <p>• Kartu berukuran <b>240×180px</b> (size large)</p>
                                    <p>• Link bisa ke halaman kategori atau URL eksternal</p>
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
