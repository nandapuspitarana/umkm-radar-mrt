import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Save, Trash2, GripVertical, ExternalLink,
    Image as ImageIcon, Link, ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// ─── Custom Multiple Select for Vendors ───────────────────────────────────────
function VendorMultiSelect({ value, onChange, vendors }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle string (comma-separated names)
    const selectedNames = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    const toggleVendor = (vendorName) => {
        let newSelected;
        if (selectedNames.includes(vendorName)) {
            newSelected = selectedNames.filter(n => n !== vendorName);
        } else {
            newSelected = [...selectedNames, vendorName];
        }
        onChange(newSelected.join(', '));
    };

    const displayValue = selectedNames.length > 0
        ? `${selectedNames.length} mitra dipilih`
        : 'Pilih mitra/vendor...';

    const filteredVendors = vendors.filter(v => 
        (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.category || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate text-gray-700">{displayValue}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-60">
                    <div className="p-2 border-b border-gray-100 flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Cari mitra / kategori..."
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {filteredVendors.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-3">Tidak ada hasil</div>
                        ) : (
                            filteredVendors.map(v => (
                                <label key={v.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                        checked={selectedNames.includes(v.name)}
                                        onChange={() => toggleVendor(v.name)}
                                    />
                                    <div className="text-xs truncate flex-1 leading-tight">
                                        <span className="font-semibold text-gray-800">{v.name}</span>
                                        <span className="text-gray-400 ml-1 font-medium">({v.category})</span>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs">
                        {selectedNames.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 font-medium">{selectedNames.length} dipilih</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange('');
                                    }}
                                    className="text-red-500 hover:text-red-700 font-semibold"
                                >
                                    Reset
                                </button>
                            </div>
                        ) : (
                            <span className="text-gray-400 italic">Belum dipilih</span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="bg-violet-100 text-violet-700 hover:bg-violet-200 px-3 py-1.5 rounded font-bold transition-colors"
                        >
                            Selesai
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Default seed data — sesuai Home.jsx saat ini ────────────────────────────
const SEED_DATA = [
    {
        id: 'wfa-1',
        title: 'Cafe Nyaman',
        subtitle: 'Free Wifi',
        image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'wfa-2',
        title: 'Co-working',
        subtitle: 'Space',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'wfa-3',
        title: 'Taman /',
        subtitle: 'Ruang Publik',
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
        link: '',
    },
    {
        id: 'wfa-4',
        title: 'Kulineran',
        subtitle: 'Aja Yuk!',
        image: 'https://images.unsplash.com/photo-1529543544277-750ee00a0b68?w=400&h=300&fit=crop',
        link: '',
    },
];

// ─── Banner Item Editor ───────────────────────────────────────────────────────
function BannerItem({ item, index, total, onChange, onDelete, onMove, vendors }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`bg-white rounded-2xl border-2 transition ${expanded ? 'border-violet-200' : 'border-gray-100'} overflow-hidden`}>
            {/* Collapsed Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                value={item.title}
                                onChange={e => onChange(index, 'title', e.target.value)}
                                placeholder="Contoh: Cafe Nyaman"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-judul</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                value={item.subtitle}
                                onChange={e => onChange(index, 'subtitle', e.target.value)}
                                placeholder="Contoh: Free Wifi"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Link Redirect (opsional)
                        </label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                value={item.link || ''}
                                onChange={e => onChange(index, 'link', e.target.value)}
                                placeholder="https://... atau /kuliner"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 mt-4 mb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-violet-600 rounded"
                                checked={item.isDynamicSubpage || false}
                                onChange={e => {
                                    onChange(index, 'isDynamicSubpage', e.target.checked);
                                }}
                            />
                            <span className="text-xs font-bold text-gray-800">Buat Halaman Khusus (Sub-page)</span>
                        </label>
                    </div>

                    {item.isDynamicSubpage && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 mb-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">URL Slug</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                    value={item.slug || ''}
                                    placeholder="Contoh: cafe, wfa"
                                    onChange={e => {
                                        onChange(index, 'slug', e.target.value);
                                        onChange(index, 'link', `/sub-page/${e.target.value}`);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Sub-page</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                    value={item.subpageTitle || ''}
                                    onChange={e => onChange(index, 'subpageTitle', e.target.value)}
                                    placeholder="Contoh: Rekomendasi WFA"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Sumber Banner</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                                    value={item.bannerSource || 'kuliner_banners'}
                                    onChange={e => onChange(index, 'bannerSource', e.target.value)}
                                >
                                    <option value="">Jangan Tampilkan Banner</option>
                                    <option value="kuliner_banners">Banner Kuliner</option>
                                    <option value="sarapan_banners">Banner Sarapan</option>
                                    <option value="ngopi_banners">Banner Ngopi</option>
                                    <option value="atm_banners">Banner ATM</option>
                                    <option value="homepage_banners">Banner Homepage</option>
                                    <option value="wfa_banners">Banner WFA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Mitra/Vendor Khusus</label>
                                <VendorMultiSelect
                                    value={item.vendorFilter || ''}
                                    onChange={val => onChange(index, 'vendorFilter', val)}
                                    vendors={vendors}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Kosongkan jika ingin menampilkan semua mitra berdasarkan kategori halaman.</p>
                            </div>
                        </div>
                    )}

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
export default function WfaBanners() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchBanners();
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            const data = await res.json();
            if (data && Array.isArray(data)) {
                setVendors(data);
            } else if (data && data.vendors) {
                setVendors(data.vendors);
            }
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
        }
    };

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.wfa_banners && Array.isArray(data.wfa_banners) && data.wfa_banners.length > 0) {
                setItems(data.wfa_banners);
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
        setItems(prev => [...prev, {
            id: `wfa-${Date.now()}`,
            title: '',
            subtitle: '',
            image: '',
            link: '',
        }]);
    };

    const handleLoadSeed = () => {
        if (!window.confirm('Reset ke data default? Semua perubahan akan hilang.')) return;
        setItems(SEED_DATA);
    };

    const handleSave = async () => {
        // Validation
        const isValid = items.every((item, i) => {
            if (!item.title || item.title.trim() === '') {
                alert(`Item ke-${i + 1} belum memiliki Judul.`);
                return false;
            }
            if (item.isDynamicSubpage) {
                if (!item.slug || item.slug.trim() === '') {
                    alert(`Item ke-${i + 1} (Sub-page): URL Slug tidak boleh kosong.`);
                    return false;
                }
                if (!item.subpageTitle || item.subpageTitle.trim() === '') {
                    alert(`Item ke-${i + 1} (Sub-page): Judul Sub-page tidak boleh kosong.`);
                    return false;
                }
            }
            return true;
        });

        if (!isValid) return;

        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wfa_banners: items }),
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
                        <h1 className="text-2xl font-bold text-gray-800">Banner Nunggu Sekalian WFA</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola kartu di section "Nunggu Sekalian WFA" pada halaman Home.
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
                            className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-600 rounded-xl hover:bg-violet-50 font-medium text-sm transition"
                        >
                            <Plus size={16} />
                            Tambah Item
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition shadow-lg ${saved
                                ? 'bg-green-600 text-white shadow-green-600/20'
                                : 'bg-violet-600 text-white shadow-violet-600/20 hover:bg-violet-700'
                                } disabled:opacity-50`}
                        >
                            <Save size={16} />
                            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan'}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left: Editor */}
                        <div className="col-span-2 space-y-3">
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                {items.length} item — urutkan dengan ↑↓
                            </p>

                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">Belum ada item</p>
                                    <button
                                        onClick={handleAdd}
                                        className="mt-3 text-violet-600 text-sm font-medium hover:underline"
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
                                        vendors={vendors}
                                    />
                                ))
                            )}
                        </div>

                        {/* Right: Live Preview */}
                        <div className="col-span-1">
                            <div className="sticky top-8">
                                <p className="text-sm font-bold text-gray-600 mb-3">Preview Section</p>
                                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <p className="text-xs font-bold text-gray-800 mb-3">Nunggu Sekalian WFA</p>

                                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                        {items.map(item => (
                                            <div
                                                key={item.id}
                                                className="w-[96px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 relative"
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon size={16} className="text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                                                <div className="absolute bottom-1 left-1 right-1">
                                                    <p className="text-white text-[8px] font-bold leading-tight">{item.title}</p>
                                                    {item.subtitle && (
                                                        <p className="text-gray-300 text-[7px] leading-tight">{item.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {items.length === 0 && (
                                            <p className="text-xs text-gray-400 py-4">(kosong)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="mt-4 p-4 bg-violet-50 rounded-2xl text-xs text-violet-700 space-y-1.5">
                                    <p className="font-bold">💡 Tips:</p>
                                    <p>• Kartu WFA berukuran <b>240×180px</b> (landscape)</p>
                                    <p>• Cocok untuk foto interior cafe, co-working, taman</p>
                                    <p>• Link bisa path lokal (e.g., <code className="bg-violet-100 px-1 rounded">/publik</code>) atau URL penuh</p>
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
