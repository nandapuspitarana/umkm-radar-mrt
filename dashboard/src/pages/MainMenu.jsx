import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../utils/api';

// SVG assets yang sudah di-upload — sync dengan CategorySidebar.jsx
const DEFAULT_MENU = [
    { id: 'rekomen', label: 'Rekomen', path: '/', svgPath: 'logo/1770871772731-a529bdeb385aa123.svg', color: 'from-red-400', isActive: true },
    { id: 'publik', label: 'Publik', path: '/publik', svgPath: 'logo/1770871919071-e53b8faf71ab40a1.svg', color: 'from-blue-400', isActive: true },
    { id: 'kuliner', label: 'Kuliner', path: '/kuliner', svgPath: 'logo/1770871967519-646c77da94660157.svg', color: 'from-amber-400', isActive: true },
    { id: 'ngopi', label: 'Ngopi', path: '/ngopi', svgPath: 'logo/1770872009104-0e2cddbda4e360c3.svg', color: 'from-amber-600', isActive: true },
    { id: 'wisata', label: 'Wisata', path: '/wisata', svgPath: 'logo/1770872135119-8992ba618988025c.svg', color: 'from-teal-400', isActive: true },
    { id: 'atm', label: 'ATM & Belanja', path: '/atm', svgPath: 'logo/1770872210180-6a935e4293a50f53.svg', color: 'from-blue-400', isActive: true },
];

const EMPTY_FORM = { id: '', label: '', path: '', svgPath: '', color: 'from-blue-400', isActive: true };

const COLOR_OPTIONS = [
    { value: 'from-red-400', label: 'Merah' },
    { value: 'from-amber-400', label: 'Kuning' },
    { value: 'from-amber-600', label: 'Coklat' },
    { value: 'from-teal-400', label: 'Teal' },
    { value: 'from-blue-400', label: 'Biru' },
    { value: 'from-purple-400', label: 'Ungu' },
    { value: 'from-pink-400', label: 'Pink' },
    { value: 'from-green-400', label: 'Hijau' },
];

function MenuIcon({ svgPath, size = 38 }) {
    if (!svgPath) return <div className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs" style={{ width: size, height: size }}>SVG</div>;
    return (
        <img
            src={getImageUrl(svgPath, { ext: 'svg', resize: 'fit' }).replace('?resize=fit&ext=webp', '').replace(/\?.*$/, '') + ''}
            alt=""
            style={{ width: size, height: size }}
            className="object-contain"
            onError={e => { e.target.style.display = 'none'; }}
        />
    );
}

// Tampilkan SVG langsung dari /api/raw/ agar tidak di-convert ke webp
function RawSvgIcon({ svgPath, size = 38 }) {
    if (!svgPath) return <div className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs" style={{ width: size, height: size }}>?</div>;
    const url = svgPath.startsWith('http') ? svgPath : `/api/raw/${svgPath.replace(/^\//, '')}`;
    return (
        <img
            src={url}
            alt=""
            style={{ width: size, height: size }}
            className="object-contain"
            onError={e => { e.target.style.opacity = 0.3; }}
        />
    );
}

export default function MainMenu() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                const saved = data.main_menu;
                setItems(Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_MENU);
            })
            .catch(() => setItems(DEFAULT_MENU))
            .finally(() => setLoading(false));
    }, []);

    const save = async (newItems) => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ main_menu: newItems }),
            });
            setItems(newItems);
        } catch (e) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadSvg = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            // url from API is like /api/raw/logo/xxx.svg — extract the path part
            const rawPath = data.url.replace(/^\/api\/raw\//, '').replace(/^\/api\/image\//, '');
            setForm(prev => ({ ...prev, svgPath: rawPath }));
        } catch (e) {
            alert('Upload gagal: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.id || !form.label || !form.path) return;
        let newItems;
        if (editingIndex !== null) {
            newItems = items.map((item, i) => i === editingIndex ? { ...form } : item);
        } else {
            newItems = [...items, { ...form }];
        }
        save(newItems);
        resetForm();
    };

    const handleEdit = (item, idx) => {
        setForm({ ...item });
        setEditingIndex(idx);
        setShowForm(true);
    };

    const handleDelete = (idx) => {
        if (!confirm(`Hapus menu "${items[idx].label}"?`)) return;
        save(items.filter((_, i) => i !== idx));
    };

    const handleToggle = (idx) => {
        save(items.map((item, i) => i === idx ? { ...item, isActive: !item.isActive } : item));
    };

    const handleMove = (idx, dir) => {
        const newItems = [...items];
        const target = idx + dir;
        if (target < 0 || target >= newItems.length) return;
        [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
        save(newItems);
    };

    const handleReset = () => {
        if (!confirm('Reset ke menu default? Semua perubahan akan hilang.')) return;
        save(DEFAULT_MENU);
    };

    const resetForm = () => { setForm(EMPTY_FORM); setEditingIndex(null); setShowForm(false); };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Menu Utama App</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola item sidebar navigasi client — menggunakan asset SVG yang sudah di-upload
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors">
                            <RefreshCw size={14} /> Reset Default
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowForm(s => !s); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                            {showForm ? <X size={14} /> : <Plus size={14} />}
                            {showForm ? 'Batal' : 'Tambah Menu'}
                        </button>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="font-bold text-gray-800 mb-5">{editingIndex !== null ? 'Edit Menu Item' : 'Tambah Menu Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {/* SVG Preview + Upload */}
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon SVG *</label>
                                    <div className="flex items-center gap-4">
                                        {/* Preview */}
                                        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <RawSvgIcon svgPath={form.svgPath} size={44} />
                                        </div>

                                        <div className="flex-1">
                                            {/* Path input */}
                                            <input
                                                type="text"
                                                value={form.svgPath}
                                                onChange={e => setForm({ ...form, svgPath: e.target.value })}
                                                placeholder="logo/1770871772731-xxx.svg"
                                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            {/* Upload button */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".svg,image/svg+xml"
                                                className="hidden"
                                                onChange={e => handleUploadSvg(e.target.files[0])}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 text-xs font-medium transition-colors disabled:opacity-50"
                                            >
                                                <Upload size={13} />
                                                {uploading ? 'Mengupload...' : 'Upload SVG baru'}
                                            </button>
                                        </div>

                                        {/* Active state preview */}
                                        <div className="flex-shrink-0 text-center">
                                            <p className="text-xs text-gray-400 mb-1">Preview aktif</p>
                                            <div className={`w-[50px] h-[50px] rounded-t-2xl flex items-center justify-center bg-gradient-to-b ${form.color} to-white`}>
                                                <RawSvgIcon svgPath={form.svgPath} size={38} />
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">{form.label || 'Label'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Unik *</label>
                                    <input
                                        type="text" required value={form.id}
                                        onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                                        placeholder="rekomen, kuliner..."
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                                    <input
                                        type="text" required value={form.label}
                                        onChange={e => setForm({ ...form, label: e.target.value })}
                                        placeholder="Kuliner, Ngopi..."
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Path / Route *</label>
                                    <input
                                        type="text" required value={form.path}
                                        onChange={e => setForm({ ...form, path: e.target.value })}
                                        placeholder="/kuliner, /ngopi..."
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Warna Gradien Aktif</label>
                                    <select
                                        value={form.color}
                                        onChange={e => setForm({ ...form, color: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                                        <input
                                            type="checkbox" checked={form.isActive}
                                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded text-blue-600"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Tampil di app</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    <Save size={14} />{editingIndex !== null ? 'Update' : 'Simpan'}
                                </button>
                                <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Batal</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Daftar Menu</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{items.filter(i => i.isActive).length} aktif · {items.length} total</p>
                        </div>
                        {saving && <span className="text-xs text-blue-600 font-medium animate-pulse">Menyimpan...</span>}
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">Memuat data...</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-left w-16">Urutan</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-left">Menu</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-left">SVG Asset</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-left">Path</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-left">Preview Aktif</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((item, idx) => (
                                    <tr key={item.id + idx} className={`hover:bg-gray-50 transition-colors ${!item.isActive ? 'opacity-40' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs">▲</button>
                                                <span className="text-xs text-gray-400 font-mono">{idx + 1}</span>
                                                <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs">▼</button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800">{item.label}</p>
                                                <p className="text-xs text-gray-400 font-mono">{item.id}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <RawSvgIcon svgPath={item.svgPath} size={32} />
                                                <code className="text-[10px] text-gray-400 max-w-[160px] truncate block">{item.svgPath || '—'}</code>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.path}</code>
                                        </td>
                                        <td className="px-4 py-3">
                                            {/* Preview how it looks in sidebar when active */}
                                            <div className={`w-[46px] h-[46px] rounded-t-xl flex items-center justify-center bg-gradient-to-b ${item.color} to-white`}>
                                                <RawSvgIcon svgPath={item.svgPath} size={34} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleToggle(idx)}
                                                    title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                                <button onClick={() => handleEdit(item, idx)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
