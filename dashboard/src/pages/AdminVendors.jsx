import React, { useState, useEffect } from 'react';
import {
    Plus, Search, MapPin, Store, Edit, Trash2,
    Package, ChevronDown, ChevronUp, X, Save,
    ToggleLeft, ToggleRight, Tag, Image as ImageIcon
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatRupiah = (val) => {
    if (!val && val !== 0) return '—';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
};

// ─── Product Modal ───────────────────────────────────────────────────────────
function ProductModal({ vendorId, product, onClose, onSaved }) {
    const isEdit = !!product;
    const [form, setForm] = useState({
        name: product?.name || '',
        price: product?.price || '',
        originalPrice: product?.originalPrice || '',
        discountPrice: product?.discountPrice || '',
        category: product?.category || 'Umum',
        description: product?.description || '',
        image: product?.image || '',
        isAvailable: product?.isAvailable !== undefined ? product.isAvailable : true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, vendorId, price: parseInt(form.price) || 0 };
            if (form.originalPrice) payload.originalPrice = parseInt(form.originalPrice);
            if (form.discountPrice) payload.discountPrice = parseInt(form.discountPrice);

            const url = isEdit ? `/api/products/${product.id}` : '/api/products';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSaved();
                onClose();
            } else {
                alert('Gagal menyimpan produk');
            }
        } catch (err) {
            console.error(err);
            alert('Error koneksi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                        <input
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Contoh: Nasi Uduk Spesial"
                        />
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            placeholder="Contoh: Makanan, Minuman, Snack"
                        />
                    </div>

                    {/* Harga */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                placeholder="15000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Asli</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={form.originalPrice}
                                onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                                placeholder="20000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Diskon</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={form.discountPrice}
                                onChange={e => setForm({ ...form, discountPrice: e.target.value })}
                                placeholder="12000"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 -mt-2">
                        💡 Harga Asli = coret-coretan, Harga Diskon = harga final setelah promo
                    </p>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <textarea
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Deskripsi singkat produk..."
                        />
                    </div>

                    {/* Foto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foto Produk</label>
                        <ImageUploader
                            value={form.image}
                            onChange={(url) => setForm({ ...form, image: url })}
                            category="product"
                            placeholder="Upload foto produk"
                        />
                    </div>

                    {/* Ketersediaan */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-700 text-sm">Status Ketersediaan</p>
                            <p className="text-xs text-gray-400">
                                {form.isAvailable ? 'Produk tersedia untuk dipesan' : 'Produk tidak tersedia / habis'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${form.isAvailable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {form.isAvailable
                                ? <><ToggleRight size={18} /> Tersedia</>
                                : <><ToggleLeft size={18} /> Habis</>
                            }
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Product Panel (inline, ditampilkan di bawah row vendor) ────────────────
function ProductPanel({ vendor, onClose }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productModal, setProductModal] = useState(null); // null | 'add' | product object

    useEffect(() => {
        fetchProducts();
    }, [vendor.id]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products?vendorId=${vendor.id}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Yakin hapus produk ini?')) return;
        try {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchProducts();
            } else {
                alert('Gagal menghapus produk');
            }
        } catch (err) {
            alert('Error koneksi');
        }
    };

    const handleToggleAvailable = async (product) => {
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable: !product.isAvailable }),
            });
            if (res.ok) fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <tr>
                <td colSpan={6} className="px-0 pb-0">
                    <div className="mx-4 mb-4 rounded-2xl border-2 border-blue-100 bg-blue-50 overflow-hidden">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <Package size={18} />
                                <span className="font-bold text-sm">
                                    Produk — {vendor.name}
                                </span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                                    {products.length} item
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setProductModal('add')}
                                    className="flex items-center gap-1.5 bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition"
                                >
                                    <Plus size={14} />
                                    Tambah Produk
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="p-4">
                            {loading ? (
                                <div className="text-center py-6 text-blue-500">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm">Memuat produk...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Package size={36} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-medium text-sm">Belum ada produk</p>
                                    <button
                                        onClick={() => setProductModal('add')}
                                        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        + Tambah produk pertama
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {products.map((product) => (
                                        <div
                                            key={product.id}
                                            className={`flex items-center gap-4 p-3 rounded-xl border bg-white transition ${product.isAvailable
                                                    ? 'border-gray-200'
                                                    : 'border-red-100 opacity-60'
                                                }`}
                                        >
                                            {/* Foto */}
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                        {product.category}
                                                    </span>
                                                    {!product.isAvailable && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                                            Habis
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {formatRupiah(product.discountPrice || product.price)}
                                                    </span>
                                                    {product.originalPrice && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {formatRupiah(product.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.description && (
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">{product.description}</p>
                                                )}
                                            </div>

                                            {/* Aksi */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handleToggleAvailable(product)}
                                                    className={`p-2 rounded-lg text-sm transition ${product.isAvailable
                                                            ? 'hover:bg-green-50 text-green-600'
                                                            : 'hover:bg-gray-100 text-gray-400'
                                                        }`}
                                                    title={product.isAvailable ? 'Tandai Habis' : 'Tandai Tersedia'}
                                                >
                                                    {product.isAvailable
                                                        ? <ToggleRight size={18} />
                                                        : <ToggleLeft size={18} />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => setProductModal(product)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                                    title="Edit Produk"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                                                    title="Hapus Produk"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>

            {/* Product Modal */}
            {productModal && (
                <ProductModal
                    vendorId={vendor.id}
                    product={productModal === 'add' ? null : productModal}
                    onClose={() => setProductModal(null)}
                    onSaved={fetchProducts}
                />
            )}
        </>
    );
}

// ─── Main AdminVendors Page ──────────────────────────────────────────────────
export default function AdminVendors() {
    const [vendors, setVendors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [expandedVendorId, setExpandedVendorId] = useState(null);

    const initialForm = {
        name: '', whatsapp: '', category: 'Umum',
        address: '', lat: '', lng: '', locationTags: '', image: ''
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            const data = await res.json();
            if (Array.isArray(data)) setVendors(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const handleEdit = (vendor) => {
        setEditingId(vendor.id);
        setFormData({
            name: vendor.name, whatsapp: vendor.whatsapp,
            category: vendor.category || 'Umum', address: vendor.address,
            lat: vendor.lat, lng: vendor.lng,
            locationTags: vendor.locationTags || '', image: vendor.image || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus mitra ini? Semua produknya juga akan terhapus.')) return;
        try {
            const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (expandedVendorId === id) setExpandedVendorId(null);
                fetchVendors();
            } else {
                alert('Gagal menghapus mitra');
            }
        } catch (error) {
            alert('Terjadi kesalahan koneksi');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng),
                rating: 5.0
            };
            let res;
            if (editingId) {
                res = await fetch(`/api/vendors/${editingId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/vendors', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            if (res.ok) {
                alert(editingId ? 'Data Mitra diperbarui!' : 'Mitra baru ditambahkan!');
                setIsModalOpen(false);
                setEditingId(null);
                setFormData(initialForm);
                fetchVendors();
            } else {
                alert('Gagal menyimpan data mitra.');
            }
        } catch (error) {
            alert('Error server.');
        }
    };

    const toggleProducts = (vendorId) => {
        setExpandedVendorId(prev => prev === vendorId ? null : vendorId);
    };

    const filteredVendors = vendors.filter(v => {
        const matchesSearch =
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.locationTags && v.locationTags.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Mitra</h1>
                        <p className="text-gray-500">Kelola daftar toko, lokasi, dan produk mitra.</p>
                    </div>
                    <button
                        data-testid="add-vendor-btn"
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                    >
                        <Plus size={18} />
                        Tambah Mitra
                    </button>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                            <Store size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Mitra</p>
                            <p className="text-2xl font-bold text-gray-800">{vendors.length}</p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800">Daftar Toko & Titik</h2>
                        <div className="flex items-center gap-3">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                {Array.from(new Set(vendors.map(v => v.category))).filter(Boolean).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari mitra / lokasi..."
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">ID</th>
                                    <th className="px-6 py-4 font-medium">Nama Toko</th>
                                    <th className="px-6 py-4 font-medium">Kategori</th>
                                    <th className="px-6 py-4 font-medium">Lokasi / Tag</th>
                                    <th className="px-6 py-4 font-medium">Koordinat</th>
                                    <th className="px-6 py-4 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Belum ada mitra ditemukan.</td></tr>
                                ) : filteredVendors.map(vendor => (
                                    <React.Fragment key={vendor.id}>
                                        <tr className={`hover:bg-gray-50 transition ${expandedVendorId === vendor.id ? 'bg-blue-50/40' : ''}`}>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-400">#{vendor.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {vendor.image ? (
                                                        <img src={vendor.image} alt={vendor.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            <Store size={16} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-gray-800">{vendor.name}</div>
                                                        <div className="text-xs text-gray-500">{vendor.whatsapp}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-bold">
                                                    {vendor.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 truncate max-w-[180px]" title={vendor.address}>{vendor.address}</div>
                                                {vendor.locationTags && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 font-medium">
                                                        <MapPin size={10} />
                                                        {vendor.locationTags}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                                {vendor.lat?.toFixed(4)}, {vendor.lng?.toFixed(4)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    {/* Kelola Produk toggle */}
                                                    <button
                                                        onClick={() => toggleProducts(vendor.id)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${expandedVendorId === vendor.id
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                            }`}
                                                        title="Kelola Produk"
                                                    >
                                                        <Package size={13} />
                                                        Produk
                                                        {expandedVendorId === vendor.id
                                                            ? <ChevronUp size={13} />
                                                            : <ChevronDown size={13} />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(vendor)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(vendor.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Inline Product Panel */}
                                        {expandedVendorId === vendor.id && (
                                            <ProductPanel
                                                vendor={vendor}
                                                onClose={() => setExpandedVendorId(null)}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Vendor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Mitra' : 'Tambah Mitra Baru'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                                <input
                                    id="name" data-testid="input-name" required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: UMKM Radar Dukuh Atas"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select
                                        id="category" data-testid="input-category"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Umum">Umum</option>
                                        <option value="Sayur">Sayur</option>
                                        <option value="Buah">Buah</option>
                                        <option value="Daging">Daging</option>
                                        <option value="Kuliner">Kuliner</option>
                                        <option value="Minuman">Minuman</option>
                                        <option value="Jasa">Jasa</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <input
                                        id="whatsapp" data-testid="input-whatsapp" required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                <textarea
                                    id="address" data-testid="input-address" required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="locationTags" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag Lokasi (Landmark/Titik Poin)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Contoh: "Dekat MRT Bundaran HI", "Samping BNI 46"</p>
                                <input
                                    id="locationTags" data-testid="input-locationTags"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.locationTags}
                                    onChange={e => setFormData({ ...formData, locationTags: e.target.value })}
                                    placeholder="Masukkan landmark terdekat..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Toko</label>
                                <ImageUploader
                                    value={formData.image}
                                    onChange={(url) => setFormData({ ...formData, image: url })}
                                    category="logo"
                                    placeholder="Upload foto toko"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input
                                        id="lat" data-testid="input-lat" type="number" step="any" required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.lat}
                                        onChange={e => setFormData({ ...formData, lat: e.target.value })}
                                        placeholder="-6.2000"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input
                                        id="lng" data-testid="input-lng" type="number" step="any" required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.lng}
                                        onChange={e => setFormData({ ...formData, lng: e.target.value })}
                                        placeholder="106.8..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                                >
                                    {editingId ? 'Simpan Perubahan' : 'Simpan Mitra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
