import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle, XCircle, ChevronRight, Ticket, ArrowLeft, RefreshCw, Package } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const STATUS_CONFIG = {
    pending: {
        label: 'Menunggu Konfirmasi',
        color: 'bg-amber-100 text-amber-700',
        icon: Clock,
        dot: 'bg-amber-400',
    },
    processing: {
        label: 'Sedang Diproses',
        color: 'bg-blue-100 text-blue-700',
        icon: Package,
        dot: 'bg-blue-500',
    },
    ready: {
        label: 'Siap Diambil',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle,
        dot: 'bg-green-500',
    },
    completed: {
        label: 'Selesai',
        color: 'bg-gray-100 text-gray-600',
        icon: CheckCircle,
        dot: 'bg-gray-400',
    },
    cancelled: {
        label: 'Dibatalkan',
        color: 'bg-red-100 text-red-600',
        icon: XCircle,
        dot: 'bg-red-400',
    },
};

function OrderCard({ order, onClick }) {
    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;
    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
            {/* Antrian Badge */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-blue-200" />
                    <span className="text-blue-100 text-xs font-medium">Nomor Antrian</span>
                </div>
                <span className="text-white font-black text-2xl tracking-widest font-mono">
                    {order.pickupCode || '------'}
                </span>
            </div>

            <div className="p-4">
                {/* Vendor & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{order.vendorName || 'Vendor'}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                weekday: 'short', day: 'numeric', month: 'short',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>

                {/* Items preview */}
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                    {items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="line-clamp-1">{item.qty}x {item.name}</span>
                            <span className="font-medium text-gray-700 ml-2">
                                {fmt((item.discountPrice || item.price || 0) * item.qty)}
                            </span>
                        </div>
                    ))}
                    {items.length > 3 && (
                        <p className="text-primary text-xs font-medium">+{items.length - 3} item lainnya</p>
                    )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-gray-500 text-sm">Total</span>
                    <span className="font-bold text-gray-900">{fmt(order.total)}</span>
                </div>
            </div>
        </motion.div>
    );
}

function OrderDetailSheet({ order, onClose }) {
    if (!order) return null;
    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;
    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Nomor Antrian Hero */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-8 pb-10 text-center">
                    <p className="text-blue-200 text-sm font-medium mb-1">Nomor Antrian Anda</p>
                    <div className="text-white font-black text-6xl tracking-widest font-mono mb-3">
                        {order.pickupCode || '------'}
                    </div>
                    <p className="text-blue-100 text-sm">{order.vendorName}</p>
                </div>

                {/* Status */}
                <div className={`mx-4 -mt-5 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg ${status.color} border border-white`}>
                    <StatusIcon size={20} />
                    <div>
                        <p className="font-bold text-sm">{status.label}</p>
                        <p className="text-xs opacity-70">
                            {order.status === 'pending' && 'Pesananmu sedang menunggu konfirmasi dari toko'}
                            {order.status === 'processing' && 'Pesananmu sedang diproses, harap tunggu'}
                            {order.status === 'ready' && 'Pesananmu siap! Tunjukkan nomor antrian ke kasir'}
                            {order.status === 'completed' && 'Pesanan telah selesai. Terima kasih!'}
                            {order.status === 'cancelled' && 'Pesanan ini telah dibatalkan'}
                        </p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Info Order */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pemesan</span>
                            <span className="font-semibold text-gray-800">{order.customer}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Waktu Pesan</span>
                            <span className="font-semibold text-gray-800">
                                {new Date(order.createdAt).toLocaleString('id-ID', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                        {order.voucherCode && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Voucher</span>
                                <span className="font-mono font-bold text-blue-600">{order.voucherCode}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <h4 className="font-bold text-gray-700 text-sm mb-2">Detail Pesanan</h4>
                        <div className="space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.qty}x
                                        </span>
                                        <span className="text-sm text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">
                                        {fmt((item.discountPrice || item.price || 0) * item.qty)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-100 pt-3 space-y-1">
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Diskon Voucher</span>
                                <span className="text-blue-600 font-medium">-{fmt(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-800">Total Bayar</span>
                            <span className="font-black text-blue-600 text-lg">{fmt(order.total)}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function MyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        try {
            // Get saved order IDs from localStorage
            const savedIds = JSON.parse(localStorage.getItem('umkm_order_ids') || '[]');
            if (savedIds.length === 0) {
                setOrders([]);
                return;
            }
            const res = await fetch(`/api/orders?ids=${savedIds.join(',')}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 30 seconds for status updates
        const interval = setInterval(() => fetchOrders(), 30000);
        return () => clearInterval(interval);
    }, []);

    const activeOrders = orders.filter(o => ['pending', 'processing', 'ready'].includes(o.status));
    const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

    return (
        <AppLayout
            title="Pesanan Saya"
            subtitle="Riwayat & Antrian"
            activeCategory=""
        >
            <div className="px-4 pt-4 pb-24">
                {/* Refresh Button */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-gray-500 text-sm">{orders.length} pesanan ditemukan</p>
                    <button
                        onClick={() => fetchOrders(true)}
                        className="flex items-center gap-1.5 text-primary text-sm font-semibold"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Perbarui
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-gray-400 text-sm">Memuat pesanan...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <ShoppingBag size={52} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="font-bold text-gray-600 mb-1">Belum Ada Pesanan</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Pesanan yang kamu buat akan muncul di sini
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm"
                        >
                            Mulai Belanja
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Active orders */}
                        {activeOrders.length > 0 && (
                            <div className="mb-6">
                                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Pesanan Aktif
                                </h2>
                                <div className="space-y-3">
                                    {activeOrders.map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onClick={() => setSelectedOrder(order)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past orders */}
                        {pastOrders.length > 0 && (
                            <div>
                                <h2 className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-3">
                                    Riwayat
                                </h2>
                                <div className="space-y-3">
                                    {pastOrders.map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onClick={() => setSelectedOrder(order)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Sheet */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailSheet
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
