import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, X, Save, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Destinations() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDest, setCurrentDest] = useState(null);

    // Initial Form State
    const initialForm = {
        name: '',
        description: '',
        category: 'Wisata Alam',
        subcategory: '',
        address: '',
        image: '',
        lat: -6.1944, // Default Jakarta Center
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

    useEffect(() => {
        fetchDestinations();
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

    const handleAdd = () => {
        setCurrentDest(null);
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const handleEdit = (dest) => {
        setCurrentDest(dest);
        setFormData({
            ...dest,
            // Ensure numbers are numbers
            lat: parseFloat(dest.lat),
            lng: parseFloat(dest.lng),
            distanceFromStation: parseFloat(dest.distanceFromStation || 0),
            walkingTimeMinutes: parseInt(dest.walkingTimeMinutes || 0),
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
        }
    };

    const filtered = destinations.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Destinasi</h1>
                        <p className="text-gray-500">Kelola daftar tempat wisata dan stasiun terdekat.</p>
                    </div>
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
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
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Tidak ada data.</td>
                                </tr>
                            ) : filtered.map(dest => (
                                <tr key={dest.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            {dest.image ? (
                                                <img src={dest.image.startsWith('http') ? dest.image : `/api/assets/${dest.image}`} alt={dest.name} className="w-full h-full object-cover" />
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${dest.category.includes('Alam') ? 'bg-green-100 text-green-700' :
                                                dest.category.includes('Sejarah') ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {dest.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${dest.stationType === 'MRT' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                                                }`}>
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
            </main>

            {/* Modal Form */}
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
                                        <select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option>Wisata Alam</option>
                                            <option>Wisata Budaya</option>
                                            <option>Wisata Sejarah</option>
                                            <option>Wisata Religi</option>
                                            <option>Wisata Kuliner</option>
                                            <option>Pusat Perbelanjaan</option>
                                        </select>
                                    </div>

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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                            <input type="number" step="any" className="w-full border p-2 rounded-lg" value={formData.lat} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                            <input type="number" step="any" className="w-full border p-2 rounded-lg" value={formData.lng} onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <input className="w-full border p-2 rounded-lg" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://... atau path assets" />
                                        {formData.image && (
                                            <img src={formData.image.startsWith('http') ? formData.image : `/api/assets/${formData.image}`} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg border" onError={(e) => e.target.style.display = 'none'} />
                                        )}
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
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition">Batal</button>
                                <button type="submit" className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center gap-2">
                                    <Save size={18} />
                                    Simpan Destinasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
