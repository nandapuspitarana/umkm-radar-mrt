import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Settings,
    LogOut,
    CheckCircle,
    Clock,
    Package,
    QrCode,
    Search,
    X
} from 'lucide-react';
// import { initialOrders, vendors } from '../data'; // Removed mock data import

import Sidebar from '../components/Sidebar';

export default function Dashboard() {
    const navigate = useNavigate();
    const [auth, setAuth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, processing, ready, completed
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [pickupInput, setPickupInput] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // ... (fetch logic remains) ...
    useEffect(() => {
        // Fetch orders from API
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            }
        };

        fetchOrders();
        // Poll every 5 seconds for new orders
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Gagal mengupdate status");
        }
    };

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
            return;
        }

        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (res.ok) {
                setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                alert("Pesanan berhasil dibatalkan");
            } else {
                alert("Gagal membatalkan pesanan");
            }
        } catch (error) {
            console.error("Failed to cancel order:", error);
            alert("Gagal membatalkan pesanan");
        }
    };

    // Scan/Input Code Logic
    const handleScanSubmit = async () => {
        if (!pickupInput) return alert("Masukkan kode!");

        try {
            const res = await fetch('/api/orders/pickup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: pickupInput,
                    vendorId: auth.vendorId
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Sukses! Pesanan #${data.order.id} telah diselesaikan.`);
                setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
                setShowPickupModal(false);
                setPickupInput('');
            } else {
                alert(data.error || "Gagal memproses kode.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan koneksi.");
        }
    };

    // Filter Logic
    const myOrders = auth.role === 'admin'
        ? orders
        : orders.filter(o => o.vendorId === auth.vendorId);

    const filteredOrders = filter === 'all'
        ? myOrders
        : filter === 'processing'
            ? myOrders.filter(o => o.status === 'processing' || o.status === 'confirmed')
            : myOrders.filter(o => o.status === filter);

    // Statistics
    const stats = {
        total: myOrders.length,
        pending: myOrders.filter(o => o.status === 'pending').length,
        processing: myOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
        ready: myOrders.filter(o => o.status === 'ready').length,
        completed: myOrders.filter(o => o.status === 'completed').length
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />

            {/* Main Content */}

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Dashboard {auth.role === 'admin' ? 'Admin' : 'Mitra'}</h1>
                        <p className="text-gray-500">Selamat datang kembali, pantau pesanan hari ini.</p>
                    </div>
                    <div className="flex gap-4">
                        {auth.role === 'vendor' && (
                            <button
                                onClick={() => setShowPickupModal(true)}
                                className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-shadow shadow-lg shadow-blue-700/20"
                            >
                                <QrCode size={18} />
                                Scan Pickup
                            </button>
                        )}
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <StatCard label="Total Pesanan" value={stats.total} icon={<Package className="text-blue-500" />} />
                    <StatCard label="Menunggu" value={stats.pending} icon={<Clock className="text-orange-500" />} />
                    <StatCard label="Disiapkan" value={stats.processing} icon={<Package className="text-blue-500" />} />
                    <StatCard label="Siap Diambil" value={stats.ready} icon={<CheckCircle className="text-yellow-500" />} />
                    <StatCard label="Selesai" value={stats.completed} icon={<CheckCircle className="text-blue-500" />} />
                </div>

                {/* Orders Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800">Daftar Pesanan</h2>
                        <div className="flex gap-2">
                            {['all', 'pending', 'processing', 'ready', 'completed', 'cancelled'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {f === 'processing' ? 'Disiapkan' : f === 'ready' ? 'Siap Diambil' : f === 'cancelled' ? 'Dibatalkan' : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">ID Pesanan</th>
                                    <th className="px-6 py-4 font-medium">Pelanggan</th>
                                    <th className="px-6 py-4 font-medium">Total</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada pesanan ditemukan.
                                        </td>
                                    </tr>
                                ) : filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.toString().slice(-6)}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                                            <div className="text-xs text-gray-500">{order.items.length} Barang</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <ActionButton label="Konfirmasi" color="blue" onClick={() => updateStatus(order.id, 'processing')} />
                                                        <ActionButton label="Batalkan" color="red" onClick={() => cancelOrder(order.id)} />
                                                    </>
                                                )}
                                                {(order.status === 'processing' || order.status === 'confirmed') && (
                                                    <>
                                                        <ActionButton label="Siap Diambil" color="yellow" onClick={() => updateStatus(order.id, 'ready')} />
                                                    </>
                                                )}
                                                {order.status === 'ready' && (
                                                    <>
                                                        <ActionButton label="Selesai" color="green" onClick={() => updateStatus(order.id, 'completed')} />
                                                    </>
                                                )}
                                                {order.status === 'completed' && (
                                                    <span className="text-xs text-gray-400">Arsip</span>
                                                )}
                                                {order.status === 'cancelled' && (
                                                    <span className="text-xs text-red-500 font-medium">Dibatalkan</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Pickup Modal */}
            {showPickupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowPickupModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <QrCode className="text-blue-600" />
                            Verifikasi Pesanan
                        </h2>

                        <div className="mb-6">
                            <div className="aspect-square bg-gray-900 rounded-xl mb-4 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group">
                                <p className="text-sm">Kamera tidak aktif</p>
                                <p className="text-xs">(Simulasi Webcam Area)</p>
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs px-4 text-center">Fitur kamera membutuhkan HTTPS & Library Tambahan</span>
                                </div>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Input Kode Manual
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Contoh: 128392"
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                    value={pickupInput}
                                    onChange={(e) => setPickupInput(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <button
                                    onClick={handleScanSubmit}
                                    className="bg-blue-600 text-white px-4 rounded-lg font-bold hover:bg-blue-700"
                                >
                                    Cek
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-xs text-gray-400">
                            Masukkan 6 digit kode unik yang dimiliki customer untuk menyelesaikan pesanan.
                        </p>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusUpdate={updateStatus}
                />
            )}
        </div>
    );
}

// Components


function StatCard({ label, value, icon }) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:translate-y-[-2px] transition-transform">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        pending: "bg-orange-100 text-orange-700",
        processing: "bg-blue-100 text-blue-700",
        ready: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
        cancelled: "bg-red-100 text-red-700"
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status]}`}>
            {status}
        </span>
    );
}

function ActionButton({ label, color, onClick }) {
    const colors = {
        blue: "bg-blue-600 hover:bg-blue-700",
        green: "bg-blue-600 hover:bg-blue-700",
        yellow: "bg-yellow-500 hover:bg-yellow-600",
        red: "bg-red-600 hover:bg-red-700"
    };
    return (
        <button
            onClick={onClick}
            className={`${colors[color]} text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-shadow hover:shadow-md`}
        >
            {label}
        </button>
    );
}

function OrderDetailModal({ order, onClose, onStatusUpdate }) {
    if (!order) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusColors = {
        pending: "bg-orange-100 text-orange-700",
        processing: "bg-blue-100 text-blue-700",
        ready: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
        cancelled: "bg-red-100 text-red-700"
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <div className="border-b pb-4 mb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-gray-800">Detail Pesanan</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[order.status]}`}>
                            {order.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Order ID: <span className="font-mono font-medium text-gray-700">#{order.id}</span> • {formatDate(order.createdAt || new Date())}
                    </p>
                </div>

                <div className="overflow-y-auto flex-1 pr-2">
                    {/* Customer Info */}
                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Informasi Pelanggan
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Nama</p>
                                <p className="font-medium text-gray-900">{order.customer}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Kontak</p>
                                <p className="font-medium text-gray-900">{order.customerPhone || '-'}</p>
                            </div>
                            {order.customerEmail && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{order.customerEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Daftar Barang ({order.items.length})
                        </h3>
                        <div className="border rounded-xl overflow-hidden mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Barang</th>
                                        <th className="px-4 py-3 text-center font-medium">Jml</th>
                                        <th className="px-4 py-3 text-right font-medium">Harga</th>
                                        <th className="px-4 py-3 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                                                {item.note && <p className="text-xs text-blue-500 italic">" {item.note} "</p>}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium bg-gray-50/50">
                                                {item.qty || item.quantity}x
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">
                                                {(item.finalPrice || item.discountPrice) && (item.finalPrice || item.discountPrice) < item.price ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs line-through text-gray-400">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.finalPrice || item.discountPrice)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format((item.finalPrice || item.discountPrice || item.price) * (item.qty || item.quantity || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end mb-6">
                        <div className="w-full max-w-xs bg-gray-50 p-4 rounded-xl">
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-500">Diskon</span>
                                <span className="font-medium text-blue-600">- {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.discount || 0)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total Akhir</span>
                                <span className="font-bold text-xl text-blue-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.finalTotal || order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                        Tutup
                    </button>
                    {order.status === 'pending' && (
                        <button
                            onClick={() => { onStatusUpdate(order.id, 'processing'); onClose(); }}
                            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        >
                            Konfirmasi Pesanan
                        </button>
                    )}
                    {(order.status === 'processing' || order.status === 'confirmed') && (
                        <button
                            onClick={() => { onStatusUpdate(order.id, 'ready'); onClose(); }}
                            className="px-6 py-2 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-500/20"
                        >
                            Siap Diambil
                        </button>
                    )}
                    {order.status === 'ready' && (
                        <button
                            onClick={() => { onStatusUpdate(order.id, 'completed'); onClose(); }}
                            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        >
                            Selesai (Sudah Diambil)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
