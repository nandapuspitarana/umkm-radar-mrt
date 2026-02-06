import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Store, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

export default function AdminVendors() {
    const [vendors, setVendors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        category: 'Umum',
        address: '',
        lat: '',
        lng: '',
        locationTags: '',
        image: '' // Store image
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            const data = await res.json();
            if (Array.isArray(data)) {
                setVendors(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng),
                rating: 5.0 // Default start rating
            };

            const res = await fetch('/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Berhasil menambahkan Mitra baru!");
                setIsModalOpen(false);
                setFormData({
                    name: '', whatsapp: '', category: 'Umum', address: '', lat: '', lng: '', locationTags: '', image: ''
                });
                fetchVendors();
            } else {
                alert("Gagal menambahkan mitra.");
            }
        } catch (error) {
            console.error(error);
            alert("Error server.");
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.locationTags && v.locationTags.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Mitra</h1>
                        <p className="text-gray-500">Kelola daftar toko dan lokasi poin mitra.</p>
                    </div>
                    <button
                        data-testid="add-vendor-btn"
                        onClick={() => setIsModalOpen(true)}
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

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">ID</th>
                                    <th className="px-6 py-4 font-medium">Nama Toko</th>
                                    <th className="px-6 py-4 font-medium">Kategori</th>
                                    <th className="px-6 py-4 font-medium">Lokasi / Tag</th>
                                    <th className="px-6 py-4 font-medium">Koordinat</th>
                                    <th className="px-6 py-4 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Belum ada mitra ditemukan.</td></tr>
                                ) : filteredVendors.map(vendor => (
                                    <tr key={vendor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-400">#{vendor.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{vendor.name}</div>
                                            <div className="text-xs text-gray-500">{vendor.whatsapp}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-bold">
                                                {vendor.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 truncate max-w-[200px]" title={vendor.address}>{vendor.address}</div>
                                            {vendor.locationTags && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 font-medium">
                                                    <MapPin size={10} />
                                                    {vendor.locationTags}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                            {vendor.lat.toFixed(4)}, {vendor.lng.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">Tambah Mitra Baru</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                                <input
                                    id="name"
                                    data-testid="input-name"
                                    required
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
                                        id="category"
                                        data-testid="input-category"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Umum">Umum</option>
                                        <option value="Sayur">Sayur</option>
                                        <option value="Buah">Buah</option>
                                        <option value="Daging">Daging</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <input
                                        id="whatsapp"
                                        data-testid="input-whatsapp"
                                        required
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
                                    id="address"
                                    data-testid="input-address"
                                    required
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
                                    id="locationTags"
                                    data-testid="input-locationTags"
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
                                        id="lat"
                                        data-testid="input-lat"
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.lat}
                                        onChange={e => setFormData({ ...formData, lat: e.target.value })}
                                        placeholder="-6.2000"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input
                                        id="lng"
                                        data-testid="input-lng"
                                        type="number"
                                        step="any"
                                        required
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
                                    Simpan Mitra
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
