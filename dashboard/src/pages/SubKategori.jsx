import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, MapPin, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── Helpers ────────────────────────────────────────────────────────────────
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

const LINE_COLORS = {
    MRT: 'bg-blue-100 text-blue-700',
    KRL: 'bg-green-100 text-green-700',
    LRT: 'bg-purple-100 text-purple-700',
    TransJakarta: 'bg-orange-100 text-orange-700',
    Whoosh: 'bg-red-100 text-red-700',
};

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg}
        </div>
    );
}

// ─── Modal Form ─────────────────────────────────────────────────────────────
function ModalForm({ title, fields, initialData, onSave, onClose, saving }) {
    const [form, setForm] = useState(initialData || {});

    const handleChange = (key, val) => {
        setForm(prev => {
            const updated = { ...prev, [key]: val };
            if (key === 'name' && !initialData?.id) updated.slug = toSlug(val);
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{field.label}{field.required && ' *'}</label>
                            {field.type === 'select' ? (
                                <select
                                    required={field.required}
                                    value={form[field.key] ?? field.default ?? ''}
                                    onChange={e => handleChange(field.key, e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                >
                                    {field.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    rows={2}
                                    value={form[field.key] ?? ''}
                                    onChange={e => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                                />
                            ) : field.type === 'toggle' ? (
                                <button
                                    type="button"
                                    onClick={() => handleChange(field.key, !form[field.key])}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${form[field.key] !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}
                                >
                                    <span className="w-4 h-4 rounded-full border-2 inline-flex items-center justify-center border-current">
                                        {form[field.key] !== false && <span className="w-2 h-2 bg-current rounded-full" />}
                                    </span>
                                    {form[field.key] !== false ? 'Aktif' : 'Nonaktif'}
                                </button>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    required={field.required}
                                    value={form[field.key] ?? ''}
                                    onChange={e => handleChange(field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm transition">Batal</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                            <Save size={14} />{saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Tab: Sub-Kategori Vendor ────────────────────────────────────────────────
function TabSubcategories({ categories }) {
    const [subcats, setSubcats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCatId, setActiveCatId] = useState(null);
    const [modal, setModal] = useState(null); // null | 'add' | item
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSubcats = async () => {
        setLoading(true);
        try {
            const url = activeCatId ? `/api/subcategories?categoryId=${activeCatId}` : '/api/subcategories';
            const res = await fetch(url);
            const data = await res.json();
            setSubcats(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSubcats(); }, [activeCatId]);

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const isEdit = !!form.id;
            const res = await fetch(isEdit ? `/api/subcategories/${form.id}` : '/api/subcategories', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: parseInt(form.categoryId || activeCatId),
                    name: form.name, slug: form.slug, icon: form.icon,
                    description: form.description, isActive: form.is_active !== false,
                    sortOrder: parseInt(form.sort_order) || 0,
                }),
            });
            if (res.ok) {
                showToast(isEdit ? 'Sub-kategori diperbarui!' : 'Sub-kategori ditambahkan!');
                setModal(null);
                fetchSubcats();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menyimpan', 'error');
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Hapus sub-kategori "${item.name}"?`)) return;
        const res = await fetch(`/api/subcategories/${item.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Dihapus!'); fetchSubcats(); }
        else showToast('Gagal menghapus', 'error');
    };

    // Group by category
    const grouped = subcats.reduce((acc, s) => {
        const key = s.category_name || 'Lainnya';
        if (!acc[key]) acc[key] = { catSlug: s.category_slug, items: [] };
        acc[key].items.push(s);
        return acc;
    }, {});

    const subCatFields = [
        {
            key: 'categoryId', label: 'Kategori', required: true, type: 'select',
            options: categories.map(c => ({ value: c.id, label: `${c.name}` })), default: activeCatId || categories[0]?.id
        },
        { key: 'name', label: 'Nama Sub-Kategori', required: true, placeholder: 'Contoh: Nasi & Lauk' },
        { key: 'slug', label: 'Slug (auto)', placeholder: 'nasi-lauk' },
        { key: 'icon', label: 'Icon (emoji)', placeholder: '🍚' },
        { key: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi singkat...' },
        { key: 'sort_order', label: 'Urutan', type: 'number', placeholder: '0' },
        { key: 'is_active', label: 'Status', type: 'toggle' },
    ];

    return (
        <div>
            {/* Filter + Add */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveCatId(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeCatId === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Semua
                    </button>
                    {categories.map(cat => (
                        <button key={cat.id}
                            onClick={() => setActiveCatId(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeCatId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setModal({ is_active: true, categoryId: activeCatId || categories[0]?.id })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                >
                    <Plus size={14} /> Tambah Sub-Kategori
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Tag size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Belum ada sub-kategori</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([catName, group]) => (
                        <div key={catName} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
                                <Tag size={14} className="text-blue-500" />
                                <span className="font-bold text-gray-700 text-sm">{catName}</span>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{group.items.length} sub-kat</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {group.items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                                        <span className="text-2xl w-8 text-center flex-shrink-0">{item.icon || '•'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-gray-800">{item.name}</span>
                                                {!item.is_active && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Nonaktif</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <code className="text-[10px] text-gray-400 font-mono">{item.slug}</code>
                                                {item.description && <span className="text-xs text-gray-400 truncate">— {item.description}</span>}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 w-8 text-center">{item.sort_order}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => setModal(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <ModalForm
                    title={modal.id ? 'Edit Sub-Kategori' : 'Tambah Sub-Kategori'}
                    fields={subCatFields}
                    initialData={modal}
                    saving={saving}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            <Toast msg={toast?.msg} type={toast?.type} />
        </div>
    );
}

// ─── Tab: Area Lokasi ────────────────────────────────────────────────────────
function TabLocationAreas() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filterLine, setFilterLine] = useState('all');
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/location-areas');
            const data = await res.json();
            setAreas(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAreas(); }, []);

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const isEdit = !!form.id;
            const res = await fetch(isEdit ? `/api/location-areas/${form.id}` : '/api/location-areas', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name, slug: form.slug, station: form.station,
                    line: form.line || 'MRT', description: form.description,
                    isActive: form.is_active !== false,
                    sortOrder: parseInt(form.sort_order) || 0,
                }),
            });
            if (res.ok) {
                showToast(isEdit ? 'Area diperbarui!' : 'Area ditambahkan!');
                setModal(null);
                fetchAreas();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menyimpan', 'error');
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (area) => {
        if (!confirm(`Hapus area "${area.name}"?`)) return;
        const res = await fetch(`/api/location-areas/${area.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Dihapus!'); fetchAreas(); }
        else showToast('Gagal menghapus', 'error');
    };

    const lines = ['all', ...new Set(areas.map(a => a.line).filter(Boolean))];
    const filtered = filterLine === 'all' ? areas : areas.filter(a => a.line === filterLine);

    const areaFields = [
        { key: 'name', label: 'Nama Area', required: true, placeholder: 'Contoh: Dukuh Atas' },
        { key: 'slug', label: 'Slug (auto)', placeholder: 'dukuh-atas' },
        { key: 'station', label: 'Stasiun Terdekat', placeholder: 'MRT Dukuh Atas BNI' },
        {
            key: 'line', label: 'Jalur / Moda', type: 'select', default: 'MRT',
            options: ['MRT', 'KRL', 'LRT', 'TransJakarta', 'Whoosh', 'Bus'].map(v => ({ value: v, label: v }))
        },
        { key: 'description', label: 'Keterangan', type: 'textarea', placeholder: 'Area Dukuh Atas — hub transportasi...' },
        { key: 'sort_order', label: 'Urutan', type: 'number', placeholder: '0' },
        { key: 'is_active', label: 'Status', type: 'toggle' },
    ];

    return (
        <div>
            {/* Filter + Add */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                    {lines.map(line => (
                        <button key={line}
                            onClick={() => setFilterLine(line)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterLine === line ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {line === 'all' ? 'Semua' : line}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setModal({ is_active: true, line: 'MRT' })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                >
                    <Plus size={14} /> Tambah Area
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                {['MRT', 'KRL', 'LRT', 'TransJakarta'].map(line => {
                    const count = areas.filter(a => a.line === line).length;
                    return (
                        <div key={line} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                            <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${LINE_COLORS[line] || 'bg-gray-100 text-gray-600'}`}>{line}</p>
                            <p className="text-2xl font-black text-gray-800">{count}</p>
                            <p className="text-xs text-gray-400">area</p>
                        </div>
                    );
                })}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <MapPin size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Belum ada area lokasi</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-5 py-3 text-left font-semibold">Area</th>
                                <th className="px-5 py-3 text-left font-semibold">Stasiun</th>
                                <th className="px-5 py-3 text-left font-semibold">Jalur</th>
                                <th className="px-5 py-3 text-left font-semibold">Status</th>
                                <th className="px-5 py-3 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-gray-800 text-sm">{area.name}</div>
                                        <code className="text-[10px] text-gray-400 font-mono">{area.slug}</code>
                                        {area.description && <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{area.description}</p>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-sm text-gray-600 flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-400" />
                                            {area.station || '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LINE_COLORS[area.line] || 'bg-gray-100 text-gray-600'}`}>
                                            {area.line}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${area.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {area.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={() => setModal(area)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(area)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <ModalForm
                    title={modal.id ? 'Edit Area Lokasi' : 'Tambah Area Lokasi'}
                    fields={areaFields}
                    initialData={modal}
                    saving={saving}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            <Toast msg={toast?.msg} type={toast?.type} />
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SubKategori() {
    const [activeTab, setActiveTab] = useState('subcategories');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const tabs = [
        { id: 'subcategories', label: '🏷️ Sub-Kategori Vendor', desc: 'Sub-kategori untuk Kuliner, Ngopi, ATM & Belanja, dll' },
        { id: 'locations', label: '📍 Area Lokasi', desc: 'Area dan stasiun untuk filter lokasi vendor' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Sub-Kategori</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola sub-kategori vendor dan area lokasi untuk filtering lebih detail
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab desc */}
                <p className="text-xs text-gray-400 mb-5">
                    {tabs.find(t => t.id === activeTab)?.desc}
                </p>

                {/* Tab Content */}
                {activeTab === 'subcategories' && <TabSubcategories categories={categories} />}
                {activeTab === 'locations' && <TabLocationAreas />}
            </main>
        </div>
    );
}
