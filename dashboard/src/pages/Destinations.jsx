import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, X, Save, Image as ImageIcon, Loader2, Tag, FolderOpen, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

/**
 * Resolve any stored image path → /uploads/* backend proxy.
 * Handles: full MinIO URL, /assets/..., /uploads/..., bare paths.
 */
const resolveImgUrl = (raw) => {
    if (!raw) return '';
    if (raw.startsWith('http') && raw.includes(':9000')) {
        const idx = raw.indexOf('/assets/');
        if (idx !== -1) return '/uploads/' + raw.slice(idx + '/assets/'.length);
        return raw;
    }
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/assets/')) return '/uploads/' + raw.slice('/assets/'.length);
    if (raw.startsWith('/uploads/')) return raw;
    return '/uploads/' + raw.replace(/^\//, '');
};

export default function Destinations() {
    // Tab state
    const [activeTab, setActiveTab] = useState('destinations');

    // Destinations state
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDest, setCurrentDest] = useState(null);
    const [saving, setSaving] = useState(false);

    // Categories state
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categoryModal, setCategoryModal] = useState({ open: false, data: null });
    const [subcategoryModal, setSubcategoryModal] = useState({ open: false, data: null });
    const [savingCategory, setSavingCategory] = useState(false);
    const [categoryTypeFilter, setCategoryTypeFilter] = useState('all');

    // Initial Form State
    const initialForm = {
        name: '',
        description: '',
        category: '',
        categoryId: '',
        subcategory: '',
        subcategoryId: '',
        address: '',
        image: '',
        lat: -6.1944,
        lng: 106.8229,
        nearestStation: '',
        stationType: 'MRT',
        distanceFromStation: 0,
        walkingTimeMinutes: 0,
        openingHours: '',
        ticketPrice: '',
        contact: '',
        website: '',
        isActive: true
    };

    const [formData, setFormData] = useState(initialForm);
    const [websiteError, setWebsiteError] = useState('');
    const [coordErrors, setCoordErrors] = useState({ lat: '', lng: '' });

    // Fetch all data on mount
    useEffect(() => {
        fetchDestinations();
        fetchCategories();
        fetchSubcategories();
    }, []);

    const fetchDestinations = async () => {
        try {
            const res = await fetch('/api/destinations');
            if (res.ok) {
                const data = await res.json();
                setDestinations(data);
            }
        } catch (error) {
            console.error("Failed to fetch destinations", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/destination-categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchSubcategories = async () => {
        try {
            const res = await fetch('/api/destination-subcategories');
            if (res.ok) {
                const data = await res.json();
                setSubcategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch subcategories", error);
        }
    };

    // Get subcategories for selected category
    const getSubcategoriesForCategory = (categoryId) => {
        return subcategories.filter(s => s.categoryId === parseInt(categoryId) && s.isActive);
    };

    // Coord validation helpers
    const blockInvalidCoordKey = (e) => {
        const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowed.includes(e.key)) return;
        if (e.key === '-' && e.target.selectionStart === 0 && !e.target.value.includes('-')) return;
        if (e.key === '.' && !e.target.value.includes('.')) return;
        if (/^[0-9]$/.test(e.key)) return;
        e.preventDefault();
    };

    const validateCoord = (field, val) => {
        const num = parseFloat(val);
        if (val === '' || val === '-') return '';
        if (!/^-?\d+(\.\d+)?$/.test(val.trim())) return 'Hanya angka & titik desimal (misal: -6.22)';
        if (field === 'lat' && (num < -90 || num > 90)) return 'Latitude harus antara -90 dan 90';
        if (field === 'lng' && (num < -180 || num > 180)) return 'Longitude harus antara -180 dan 180';
        return '';
    };

    const handleCoordChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
        setCoordErrors(prev => ({ ...prev, [field]: validateCoord(field, val) }));
    };

    // Website validation
    const isValidGmapsUrl = (url) => {
        if (!url || !url.trim()) return true;
        try {
            const u = new URL(url.trim());
            const host = u.hostname.toLowerCase();
            return (
                host === 'maps.google.com' ||
                host === 'www.google.com' ||
                host === 'maps.app.goo.gl' ||
                host === 'goo.gl'
            );
        } catch {
            return false;
        }
    };

    const handleWebsiteChange = (val) => {
        setFormData(prev => ({ ...prev, website: val }));
        if (!isValidGmapsUrl(val)) {
            setWebsiteError('Format link tidak valid. Gunakan link dari Google Maps');
        } else {
            setWebsiteError('');
        }
    };

    // Handle category change in form
    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        const category = categories.find(c => c.id === parseInt(categoryId));
        setFormData(prev => ({
            ...prev,
            categoryId: categoryId,
            category: category?.name || '',
            subcategoryId: '',
            subcategory: ''
        }));
    };

    const handleSubcategoryChange = (e) => {
        const subcategoryId = e.target.value;
        const subcategory = subcategories.find(s => s.id === parseInt(subcategoryId));
        setFormData(prev => ({
            ...prev,
            subcategoryId: subcategoryId,
            subcategory: subcategory?.name || ''
        }));
    };

    const handleAdd = () => {
        setCurrentDest(null);
        setFormData({
            ...initialForm,
            categoryId: categories[0]?.id || '',
            category: categories[0]?.name || ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (dest) => {
        setCurrentDest(dest);
        setFormData({
            name: dest.name || '',
            description: dest.description || '',
            category: dest.category || '',
            categoryId: dest.categoryId || '',
            subcategory: dest.subcategory || '',
            subcategoryId: dest.subcategoryId || '',
            address: dest.address || '',
            image: dest.image || '',
            lat: parseFloat(dest.lat) || -6.1944,
            lng: parseFloat(dest.lng) || 106.8229,
            nearestStation: dest.nearestStation || '',
            stationType: dest.stationType || 'MRT',
            distanceFromStation: parseFloat(dest.distanceFromStation) || 0,
            walkingTimeMinutes: parseInt(dest.walkingTimeMinutes) || 0,
            openingHours: dest.openingHours || '',
            ticketPrice: dest.ticketPrice || '',
            contact: dest.contact || '',
            website: dest.website || '',
            isActive: dest.isActive !== false,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus destinasi ini?")) return;
        try {
            const res = await fetch(`/api/destinations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDestinations(prev => prev.filter(d => d.id !== id));
            } else {
                alert("Gagal menghapus");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const latErr = validateCoord('lat', String(formData.lat));
        const lngErr = validateCoord('lng', String(formData.lng));
        if (latErr || lngErr) {
            setCoordErrors({ lat: latErr, lng: lngErr });
            return;
        }

        if (!isValidGmapsUrl(formData.website)) {
            setWebsiteError('Format link tidak valid. Pastikan menggunakan link dari Google Maps.');
            return;
        }

        if (saving) return;
        setSaving(true);

        const url = currentDest ? `/api/destinations/${currentDest.id}` : '/api/destinations';
        const method = currentDest ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const saved = await res.json();
                if (currentDest) {
                    setDestinations(prev => prev.map(d => d.id === saved.id ? saved : d));
                } else {
                    setDestinations(prev => [...prev, saved]);
                }
                setIsModalOpen(false);
            } else {
                const err = await res.json();
                alert(err.error || "Gagal menyimpan");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setSaving(false);
        }
    };

    // Category CRUD handlers
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (savingCategory) return;
        setSavingCategory(true);

        const url = categoryModal.data?.id
            ? `/api/destination-categories/${categoryModal.data.id}`
            : '/api/destination-categories';
        const method = categoryModal.data?.id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryModal.data || {})
            });

            if (res.ok) {
                fetchCategories();
                setCategoryModal({ open: false, data: null });
            } else {
                const err = await res.json();
                alert(err.error || "Gagal menyimpan kategori");
            }
        } catch (error) {
            alert("Terjadi kesalahan");
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Yakin ingin menghapus kategori ini?")) return;
        try {
            const res = await fetch(`/api/destination-categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCategories(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Gagal menghapus");
            }
        } catch (error) {
            alert("Terjadi kesalahan");
        }
    };

    // Subcategory CRUD handlers
    const handleSaveSubcategory = async (e) => {
        e.preventDefault();
        if (savingCategory) return;
        setSavingCategory(true);

        const url = subcategoryModal.data?.id
            ? `/api/destination-subcategories/${subcategoryModal.data.id}`
            : '/api/destination-subcategories';
        const method = subcategoryModal.data?.id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryModal.data || {})
            });

            if (res.ok) {
                fetchSubcategories();
                setSubcategoryModal({ open: false, data: null });
            } else {
                const err = await res.json();
                alert(err.error || "Gagal menyimpan sub kategori");
            }
        } catch (error) {
            alert("Terjadi kesalahan");
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteSubcategory = async (id) => {
        if (!window.confirm("Yakin ingin menghapus sub kategori ini?")) return;
        try {
            const res = await fetch(`/api/destination-subcategories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSubcategories(prev => prev.filter(s => s.id !== id));
            } else {
                alert("Gagal menghapus");
            }
        } catch (error) {
            alert("Terjadi kesalahan");
        }
    };

    const filtered = destinations.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group subcategories by category for display
    const subcategoriesByCategory = categories.map(cat => ({
        ...cat,
        subcats: subcategories.filter(s => s.categoryId === cat.id)
    }));

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('destinations')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'destinations'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <MapPin className="inline-block mr-2" size={18} />
                        Destinasi
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'categories'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <FolderOpen className="inline-block mr-2" size={18} />
                        Kategori
                    </button>
                    <button
                        onClick={() => setActiveTab('subcategories')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'subcategories'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <Tag className="inline-block mr-2" size={18} />
                        Sub Kategori
                    </button>
                </div>

                {/* DESTINATIONS TAB */}
                {activeTab === 'destinations' && (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Manajemen Destinasi</h1>
                                <p className="text-gray-500">Kelola daftar tempat wisata dan stasiun terdekat.</p>
                            </div>
                            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 text-sm font-bold">
                                <Plus size={20} />
                                Tambah Destinasi
                            </button>
                        </header>

                        {/* Search Bar */}
                        <div className="mb-6 relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari nama destinasi..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Image</th>
                                        <th className="px-6 py-4">Nama Destinasi</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Stasiun Terdekat</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                <Loader2 className="animate-spin inline-block mr-2" />
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Tidak ada data.</td>
                                        </tr>
                                    ) : filtered.map(dest => (
                                        <tr key={dest.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    {dest.image ? (
                                                        <img
                                                            src={resolveImgUrl(dest.image)}
                                                            alt={dest.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                if (e.target.src !== dest.image) {
                                                                    e.target.src = dest.image;
                                                                } else {
                                                                    e.target.style.display = 'none';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{dest.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{dest.address}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    {dest.category}
                                                </span>
                                                {dest.subcategory && (
                                                    <span className="block mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                                        {dest.subcategory}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${dest.stationType === 'MRT' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                                                        {dest.stationType}
                                                    </span>
                                                    <span className="text-sm">{dest.nearestStation}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{dest.distanceFromStation} km ({dest.walkingTimeMinutes} min)</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(dest)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(dest.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === 'categories' && (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Kategori Destinasi</h1>
                                <p className="text-gray-500">Kelola kategori untuk destinasi wisata dan publik.</p>
                            </div>
                            <button
                                onClick={() => setCategoryModal({ open: true, data: { name: '', slug: '', type: 'wisata', icon: '', bannerImage: '', sortOrder: 0, isActive: true } })}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 text-sm font-bold"
                            >
                                <Plus size={20} />
                                Tambah Kategori
                            </button>
                        </header>

                        {/* Type Filter */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setCategoryTypeFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${categoryTypeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setCategoryTypeFilter('wisata')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${categoryTypeFilter === 'wisata' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Wisata
                            </button>
                            <button
                                onClick={() => setCategoryTypeFilter('publik')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${categoryTypeFilter === 'publik' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Publik
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Nama Kategori</th>
                                        <th className="px-6 py-4">Tipe</th>
                                        <th className="px-6 py-4">Slug</th>
                                        <th className="px-6 py-4">Banner</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {categories.filter(cat => categoryTypeFilter === 'all' || cat.type === categoryTypeFilter).length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Belum ada kategori.</td>
                                        </tr>
                                    ) : categories.filter(cat => categoryTypeFilter === 'all' || cat.type === categoryTypeFilter).map(cat => (
                                        <tr key={cat.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${cat.type === 'wisata' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {cat.type === 'wisata' ? 'Wisata' : 'Publik'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-sm">{cat.slug}</td>
                                            <td className="px-6 py-4">
                                                {cat.bannerImage ? (
                                                    <img
                                                        src={resolveImgUrl(cat.bannerImage)}
                                                        alt="Banner"
                                                        className="h-10 w-16 object-cover rounded border"
                                                        onError={(e) => {
                                                            if (e.target.src !== cat.bannerImage) {
                                                                e.target.src = cat.bannerImage;
                                                            } else {
                                                                e.target.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {cat.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => setCategoryModal({ open: true, data: cat })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* SUBCATEGORIES TAB */}
                {activeTab === 'subcategories' && (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Sub Kategori Destinasi</h1>
                                <p className="text-gray-500">Kelola sub kategori untuk setiap kategori wisata dan publik.</p>
                            </div>
                            <button
                                onClick={() => setSubcategoryModal({ open: true, data: { categoryId: categories[0]?.id || '', name: '', slug: '', bannerImage: '', sortOrder: 0, isActive: true } })}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 text-sm font-bold"
                            >
                                <Plus size={20} />
                                Tambah Sub Kategori
                            </button>
                        </header>

                        <div className="space-y-4">
                            {subcategoriesByCategory.map(cat => (
                                <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cat.type === 'wisata' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {cat.type === 'wisata' ? 'Wisata' : 'Publik'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{cat.subcats.length} sub kategori</span>
                                    </div>
                                    {cat.subcats.length === 0 ? (
                                        <div className="px-6 py-4 text-gray-500 text-sm">Belum ada sub kategori untuk kategori ini.</div>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-gray-50/50 text-left text-xs text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-6 py-3">Nama</th>
                                                    <th className="px-6 py-3">Slug</th>
                                                    <th className="px-6 py-3">Banner</th>
                                                    <th className="px-6 py-3 text-center">Status</th>
                                                    <th className="px-6 py-3 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {cat.subcats.map(sub => (
                                                    <tr key={sub.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 text-sm text-gray-900">{sub.name}</td>
                                                        <td className="px-6 py-3 text-sm text-gray-500 font-mono">{sub.slug}</td>
                                                        <td className="px-6 py-3">
                                                            {sub.bannerImage ? (
                                                                <img
                                                                    src={resolveImgUrl(sub.bannerImage)}
                                                                    alt="Banner"
                                                                    className="h-8 w-14 object-cover rounded border"
                                                                    onError={(e) => {
                                                                        if (e.target.src !== sub.bannerImage) {
                                                                            e.target.src = sub.bannerImage;
                                                                        } else {
                                                                            e.target.style.display = 'none';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                {sub.isActive ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => setSubcategoryModal({ open: true, data: sub })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => handleDeleteSubcategory(sub.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
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
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Destination Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 relative flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold">{currentDest ? 'Edit Destinasi' : 'Tambah Destinasi Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Informasi Dasar</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Destinasi *</label>
                                        <input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                        <select
                                            className="w-full border p-2 rounded-lg"
                                            value={formData.categoryId || ''}
                                            onChange={handleCategoryChange}
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.filter(c => c.isActive).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {formData.categoryId && getSubcategoriesForCategory(formData.categoryId).length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub Kategori</label>
                                            <select
                                                className="w-full border p-2 rounded-lg"
                                                value={formData.subcategoryId || ''}
                                                onChange={handleSubcategoryChange}
                                            >
                                                <option value="">Pilih Sub Kategori</option>
                                                {getSubcategoriesForCategory(formData.categoryId).map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                        <textarea className="w-full border p-2 rounded-lg h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                        <textarea className="w-full border p-2 rounded-lg h-20" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className={`w-full border p-2 rounded-lg transition focus:outline-none focus:ring-2 ${coordErrors.lat ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-500'}`}
                                                value={formData.lat}
                                                onKeyDown={blockInvalidCoordKey}
                                                onChange={e => handleCoordChange('lat', e.target.value)}
                                                placeholder="-6.2088"
                                            />
                                            {coordErrors.lat && <p className="text-red-500 text-xs mt-1">⚠ {coordErrors.lat}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className={`w-full border p-2 rounded-lg transition focus:outline-none focus:ring-2 ${coordErrors.lng ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-500'}`}
                                                value={formData.lng}
                                                onKeyDown={blockInvalidCoordKey}
                                                onChange={e => handleCoordChange('lng', e.target.value)}
                                                placeholder="106.8456"
                                            />
                                            {coordErrors.lng && <p className="text-red-500 text-xs mt-1">⚠ {coordErrors.lng}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Destinasi</label>
                                        <ImageUploader
                                            value={formData.image}
                                            onChange={(url) => setFormData({ ...formData, image: url })}
                                            category="destination"
                                            placeholder="Upload foto destinasi atau masukkan URL"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Transport & Details */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Transport & Detail</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Stasiun</label>
                                            <select className="w-full border p-2 rounded-lg" value={formData.stationType} onChange={e => setFormData({ ...formData, stationType: e.target.value })}>
                                                <option>MRT</option>
                                                <option>KRL</option>
                                                <option>LRT</option>
                                                <option>TransJakarta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Stasiun</label>
                                            <input className="w-full border p-2 rounded-lg" value={formData.nearestStation} onChange={e => setFormData({ ...formData, nearestStation: e.target.value })} placeholder="e.g. Bundaran HI" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jarak (km)</label>
                                            <input type="number" step="0.1" className="w-full border p-2 rounded-lg" value={formData.distanceFromStation} onChange={e => setFormData({ ...formData, distanceFromStation: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jalan Kaki (menit)</label>
                                            <input type="number" className="w-full border p-2 rounded-lg" value={formData.walkingTimeMinutes} onChange={e => setFormData({ ...formData, walkingTimeMinutes: parseInt(e.target.value) })} />
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
                                        <input className="w-full border p-2 rounded-lg" value={formData.openingHours} onChange={e => setFormData({ ...formData, openingHours: e.target.value })} placeholder="e.g. 08:00 - 17:00" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Link Google Maps
                                            <span className="ml-1 text-xs text-gray-400 font-normal">(untuk tombol Peta di aplikasi)</span>
                                        </label>
                                        <input
                                            className={`w-full border p-2 rounded-lg transition focus:outline-none focus:ring-2 ${websiteError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-500'}`}
                                            value={formData.website}
                                            onChange={e => handleWebsiteChange(e.target.value)}
                                            placeholder="https://maps.app.goo.gl/..."
                                        />
                                        {websiteError ? (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <span>⚠</span> {websiteError}
                                            </p>
                                        ) : (
                                            <p className="text-gray-400 text-xs mt-1">
                                                💡 Copy link dari Google Maps → Share → Copy Link
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Tiket</label>
                                        <input className="w-full border p-2 rounded-lg" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} placeholder="e.g. Rp 50.000 / Gratis" />
                                    </div>

                                    <div className="flex items-center gap-2 mt-4">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            className="w-4 h-4 text-blue-600 rounded"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Tampilkan di Aplikasi</label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition disabled:opacity-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {saving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Destinasi</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {categoryModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">{categoryModal.data?.id ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                            <button onClick={() => setCategoryModal({ open: false, data: null })}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori *</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={categoryModal.data?.name || ''}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug * <span className="text-gray-400 font-normal text-xs">(untuk URL, contoh: alam-ruang-terbuka)</span></label>
                                <input
                                    required
                                    className="w-full border p-2 rounded-lg font-mono"
                                    value={categoryModal.data?.slug || ''}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() } }))}
                                    placeholder="contoh-slug"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kategori *</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={categoryModal.data?.type || 'wisata'}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, type: e.target.value } }))}
                                >
                                    <option value="wisata">Wisata</option>
                                    <option value="publik">Publik</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image <span className="text-gray-400 font-normal text-xs">(untuk halaman kategori)</span></label>
                                <ImageUploader
                                    value={categoryModal.data?.bannerImage || ''}
                                    onChange={(url) => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, bannerImage: url } }))}
                                    category="banner"
                                    placeholder="Upload banner untuk halaman kategori"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icon <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
                                <input
                                    className="w-full border p-2 rounded-lg"
                                    value={categoryModal.data?.icon || ''}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: e.target.value } }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded-lg"
                                    value={categoryModal.data?.sortOrder || 0}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, sortOrder: parseInt(e.target.value) } }))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="catIsActive"
                                    className="w-4 h-4 text-blue-600 rounded"
                                    checked={categoryModal.data?.isActive !== false}
                                    onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, isActive: e.target.checked } }))}
                                />
                                <label htmlFor="catIsActive" className="text-sm font-medium text-gray-700">Aktif</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setCategoryModal({ open: false, data: null })} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold">Batal</button>
                                <button type="submit" disabled={savingCategory} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
                                    {savingCategory ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {subcategoryModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">{subcategoryModal.data?.id ? 'Edit Sub Kategori' : 'Tambah Sub Kategori'}</h2>
                            <button onClick={() => setSubcategoryModal({ open: false, data: null })}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleSaveSubcategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={subcategoryModal.data?.categoryId || ''}
                                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, categoryId: parseInt(e.target.value) } }))}
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.filter(c => c.isActive).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sub Kategori *</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={subcategoryModal.data?.name || ''}
                                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug * <span className="text-gray-400 font-normal text-xs">(untuk URL)</span></label>
                                <input
                                    required
                                    className="w-full border p-2 rounded-lg font-mono"
                                    value={subcategoryModal.data?.slug || ''}
                                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() } }))}
                                    placeholder="contoh-slug"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image <span className="text-gray-400 font-normal text-xs">(untuk section sub kategori)</span></label>
                                <ImageUploader
                                    value={subcategoryModal.data?.bannerImage || ''}
                                    onChange={(url) => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, bannerImage: url } }))}
                                    category="banner"
                                    placeholder="Upload banner untuk section sub kategori"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded-lg"
                                    value={subcategoryModal.data?.sortOrder || 0}
                                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, sortOrder: parseInt(e.target.value) } }))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="subcatIsActive"
                                    className="w-4 h-4 text-blue-600 rounded"
                                    checked={subcategoryModal.data?.isActive !== false}
                                    onChange={e => setSubcategoryModal(prev => ({ ...prev, data: { ...prev.data, isActive: e.target.checked } }))}
                                />
                                <label htmlFor="subcatIsActive" className="text-sm font-medium text-gray-700">Aktif</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setSubcategoryModal({ open: false, data: null })} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold">Batal</button>
                                <button type="submit" disabled={savingCategory} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
                                    {savingCategory ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
