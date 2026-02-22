import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Save, X, Train, Search, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';

// Daftar default stasiun MRT Jakarta yang bisa dikustomisasi
const DEFAULT_STATIONS = [
    { name: 'Lebak Bulus Grab', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Fatmawati Indomaret', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Cipete Raya', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Haji Nawi', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Blok A', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Blok M BCA', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'ASEAN', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Senayan Mastercard', line: 'NS', area: 'Jakarta Selatan' },
    { name: 'Istora Mandiri', line: 'NS', area: 'Jakarta Pusat' },
    { name: 'Bendungan Hilir', line: 'NS', area: 'Jakarta Pusat' },
    { name: 'Setiabudi Astra', line: 'NS', area: 'Jakarta Pusat' },
    { name: 'Dukuh Atas BNI', line: 'NS', area: 'Jakarta Pusat' },
    { name: 'Bundaran HI', line: 'NS', area: 'Jakarta Pusat' },
];

export default function StationCategories() {
    const [stations, setStations] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStation, setEditStation] = useState(null);
    const [formData, setFormData] = useState({ name: '', line: 'NS', area: '' });
    const [saving, setSaving] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch settings untuk station list
            const [settingsRes, vendorsRes] = await Promise.all([
                fetch('/api/settings'),
                fetch('/api/vendors'),
            ]);
            const settings = await settingsRes.json();
            const vendorData = await vendorsRes.json();

            setVendors(Array.isArray(vendorData) ? vendorData : []);

            // Load station list dari settings atau gunakan default
            const saved = settings.station_categories;
            if (saved && Array.isArray(saved) && saved.length > 0) {
                setStations(saved);
            } else {
                setStations(DEFAULT_STATIONS);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            setStations(DEFAULT_STATIONS);
        } finally {
            setLoading(false);
        }
    };

    const saveStations = async (newList) => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station_categories: newList }),
            });
            setStations(newList);
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = () => {
        setEditStation(null);
        setFormData({ name: '', line: 'NS', area: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (station, idx) => {
        setEditStation(idx);
        setFormData({ ...station });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return alert('Nama stasiun wajib diisi');
        const newList = [...stations];
        if (editStation !== null) {
            newList[editStation] = { ...formData };
        } else {
            newList.push({ ...formData });
        }
        await saveStations(newList);
        setIsModalOpen(false);
    };

    const handleDelete = async (idx) => {
        if (!window.confirm('Yakin hapus stasiun ini?')) return;
        const newList = stations.filter((_, i) => i !== idx);
        await saveStations(newList);
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm('Reset ke daftar stasiun default MRT Jakarta?')) return;
        await saveStations(DEFAULT_STATIONS);
    };

    // Count vendors per station
    const getVendorCount = (stationName) => {
        const lower = stationName.toLowerCase();
        return vendors.filter(v =>
            (v.locationTags || v.location_tags || '').toLowerCase().includes(lower)
        ).length;
    };

    const filtered = stations.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.area || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const vendorsForStation = selectedStation
        ? vendors.filter(v =>
            (v.locationTags || v.location_tags || '').toLowerCase()
                .includes(selectedStation.name.toLowerCase())
        )
        : [];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Header */}
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Train size={24} className="text-blue-600" />
                            Manajemen Kategori Stasiun
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Kelola daftar stasiun MRT sebagai kategori lokasi mitra/vendor.
                            Vendor akan ditampilkan berdasarkan stasiun yang dipilih pengguna.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSeedDefaults}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                        >
                            <RefreshCw size={16} />
                            Reset Default
                        </button>
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                        >
                            <Plus size={20} />
                            Tambah Stasiun
                        </button>
                    </div>
                </header>

                <div className="flex gap-6">
                    {/* Station List */}
                    <div className="flex-1">
                        {/* Search */}
                        <div className="mb-4 relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama stasiun..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Info Banner */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex items-start gap-3">
                            <MapPin size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-blue-800">Cara Kerja Kategori Stasiun</p>
                                <p className="text-blue-600 mt-0.5">
                                    Setiap mitra/vendor memiliki field <strong>Location Tags</strong> yang berisi nama stasiun terdekat.
                                    Aplikasi akan menampilkan vendor yang Location Tags-nya cocok dengan stasiun aktif pengguna terlebih dahulu.
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Nama Stasiun</th>
                                            <th className="px-6 py-4">Wilayah</th>
                                            <th className="px-6 py-4">Line</th>
                                            <th className="px-6 py-4 text-center">Vendor Terdaftar</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    {stations.length === 0 ? (
                                                        <div>
                                                            <p className="font-semibold mb-1">Belum ada stasiun</p>
                                                            <button onClick={handleSeedDefaults} className="text-blue-600 text-sm underline">
                                                                Muat stasiun default MRT Jakarta
                                                            </button>
                                                        </div>
                                                    ) : 'Tidak ada hasil pencarian.'}
                                                </td>
                                            </tr>
                                        ) : filtered.map((station, idx) => {
                                            const realIdx = stations.indexOf(station);
                                            const count = getVendorCount(station.name);
                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedStation?.name === station.name ? 'bg-blue-50' : ''}`}
                                                    onClick={() => setSelectedStation(
                                                        selectedStation?.name === station.name ? null : station
                                                    )}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                            <span className="font-semibold text-gray-800 text-sm">
                                                                {station.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {station.area || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                            {station.line || 'NS'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                                            {count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => handleEdit(station, realIdx)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(realIdx)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Vendor Panel per Station */}
                    {selectedStation && (
                        <div className="w-80 flex-shrink-0">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                                <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-sm text-blue-800">{selectedStation.name}</h3>
                                        <p className="text-xs text-blue-600">{vendorsForStation.length} vendor terdaftar</p>
                                    </div>
                                    <button onClick={() => setSelectedStation(null)} className="text-gray-400 hover:text-gray-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                                    {vendorsForStation.length === 0 ? (
                                        <div className="p-6 text-center text-gray-400">
                                            <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Belum ada vendor</p>
                                            <p className="text-xs mt-1">Atur Location Tags vendor di halaman Mitra & Lokasi</p>
                                        </div>
                                    ) : vendorsForStation.map(v => (
                                        <div key={v.id} className="px-4 py-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                {v.image ? (
                                                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg">🏪</div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{v.category}</p>
                                                <p className="text-xs text-blue-500 truncate">{v.locationTags || v.location_tags}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold">
                                {editStation !== null ? 'Edit Stasiun' : 'Tambah Stasiun Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Stasiun <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. Senayan Mastercard"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Nama ini harus sama persis dengan Location Tags vendor
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={formData.line}
                                        onChange={e => setFormData({ ...formData, line: e.target.value })}
                                    >
                                        <option value="NS">NS (Lebak Bulus - Bundaran HI)</option>
                                        <option value="EW">EW (Timur - Barat)</option>
                                        <option value="CP">CP (Cikarang - Pluit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
                                    <input
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="e.g. Jakarta Selatan"
                                        value={formData.area}
                                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
