import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Percent } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Vouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));

    const [formData, setFormData] = useState({
        code: '',
        type: 'fixed', // or percentage
        value: '',
        minPurchase: 0,
        maxDiscount: 0,
        vendorId: auth.role === 'admin' ? '' : auth.vendorId, // Admin can leave empty for global
        isGlobal: false // Only for admin UI logic
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            // If admin, fetch all. If vendor, clean logic on backend handles it, but we pass vendorId just in case
            const url = auth.role === 'admin'
                ? '/api/vouchers?isAdmin=true'
                : `/api/vouchers?vendorId=${auth.vendorId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let payload = {
            ...formData,
            value: parseInt(formData.value),
            minPurchase: parseInt(formData.minPurchase),
            maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount) : null,
            vendorId: auth.role === 'vendor' ? auth.vendorId : (formData.isGlobal ? null : auth.vendorId) // If admin & global unchecked, assign to null? Wait, Admin creates Global (null)
        };

        // Simplify: Admin always creates Global for now in this UI.
        // Or if Admin wants to create for specific vendor, they need a vendor select.
        // Let's assume Admin -> Global, Vendor -> Specific.
        if (auth.role === 'admin') payload.vendorId = null;

        try {
            const res = await fetch('/api/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Voucher dibuat!");
                setShowModal(false);
                fetchVouchers();
                setFormData({ ...formData, code: '', value: '' });
            } else {
                alert("Gagal membuat voucher (Kode mungkin duplikat).");
            }
        } catch (error) {
            alert("Error koneksi");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus voucher ini?")) return;
        await fetch(`/api/vouchers/${id}`, { method: 'DELETE' });
        fetchVouchers();
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Voucher & Promo</h1>
                        <p className="text-gray-500">
                            {auth.role === 'admin' ? 'Kelola voucher global untuk semua pengguna.' : 'Buat voucher khusus untuk toko Anda.'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-800"
                    >
                        <Plus size={18} /> Buat Voucher
                    </button>
                </header>

                <div className="grid grid-cols-3 gap-6">
                    {vouchers.map(v => (
                        <div key={v.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${v.vendorId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {v.vendorId ? 'Toko Apps' : 'Global Promo'}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                    <Ticket size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 tracking-wide">{v.code}</h3>
                                    <p className="text-sm text-gray-500">
                                        Diskon {v.type === 'fixed' ? `Rp ${v.value / 1000}rb` : `${v.value}%`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                    <span>Min. Belanja:</span>
                                    <span className="font-medium">{new Intl.NumberFormat('id-ID').format(v.minPurchase)}</span>
                                </div>
                                {v.type === 'percentage' && (
                                    <div className="flex justify-between">
                                        <span>Max Potongan:</span>
                                        <span className="font-medium">{v.maxDiscount ? new Intl.NumberFormat('id-ID').format(v.maxDiscount) : 'No Limit'}</span>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => handleDelete(v.id)} className="w-full py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={16} /> Hapus Voucher
                            </button>
                        </div>
                    ))}
                </div>

                {/* Modal Form */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-6">Buat Voucher Baru</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher</label>
                                    <input required type="text" className="w-full p-2 border rounded-lg uppercase tracking-wider font-bold" placeholder="CONTOH: HEMAT10" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                                        <select className="w-full p-2 border rounded-lg" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="fixed">Nominal (Rp)</option>
                                            <option value="percentage">Persen (%)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nilai</label>
                                        <input required type="number" className="w-full p-2 border rounded-lg" placeholder="10000 or 10" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Belanja</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={formData.minPurchase} onChange={e => setFormData({ ...formData, minPurchase: e.target.value })} />
                                </div>

                                {formData.type === 'percentage' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Diskon (Rp)</label>
                                        <input type="number" className="w-full p-2 border rounded-lg" value={formData.maxDiscount || ''} onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })} />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium">Buat</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
