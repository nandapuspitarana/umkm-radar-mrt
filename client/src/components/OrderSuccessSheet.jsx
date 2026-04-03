import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Ticket, ArrowRight, MessageCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/**
 * Sheet yang muncul setelah checkout berhasil.
 * Menampilkan nomor antrian & tombol ke WA + riwayat pesanan.
 */
export default function OrderSuccessSheet({ order, onClose, onOpenWhatsApp }) {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="relative bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Success Header */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-8 pb-12 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                        className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <CheckCircle size={36} className="text-white" />
                    </motion.div>
                    <h2 className="text-white font-black text-xl mb-1">Pesanan Berhasil!</h2>
                    <p className="text-blue-200 text-sm">Tunjukkan nomor antrian ini ke kasir</p>
                </div>

                {/* Nomor Antrian Card */}
                <div className="mx-5 -mt-7 bg-white rounded-2xl shadow-xl border border-blue-100 p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Ticket size={16} className="text-blue-400" />
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Nomor Antrian</p>
                    </div>
                    <p className="font-black text-6xl text-blue-700 font-mono tracking-widest">
                        {order.pickupCode}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">{order.vendorName || 'Vendor'}</p>
                </div>

                {/* Summary */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Total Pembayaran</span>
                        <span className="font-bold text-gray-800">{fmt(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Untuk</span>
                        <span className="font-semibold text-gray-700">{order.customer}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 pt-3 pb-8 space-y-3">
                    <button
                        onClick={onOpenWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-green-500/30"
                    >
                        <MessageCircle size={20} />
                        Kirim ke WhatsApp Toko
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl text-sm"
                    >
                        Lihat Riwayat Pesanan
                        <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
