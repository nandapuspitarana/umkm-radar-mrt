import React, { useState } from 'react';
import { X, MessageCircle, Plus, Minus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);
const fmtCurrency = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// ─── Modal Konfirmasi Batal ──────────────────────────────────────────────────
function ConfirmCancelModal({ onConfirm, onDismiss }) {
    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center"
            >
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Batalkan Pembelian?</h3>
                <p className="text-sm text-gray-500 mb-5">
                    Semua item di keranjang akan dihapus. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onDismiss}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition"
                    >
                        Ya, Batalkan
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function CartSheet({ isOpen, onClose, cart, vendor, onCheckout, onUpdateQty, onRemoveItem, onClearCart }) {
    if (!isOpen) return null;

    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [loadingVoucher, setLoadingVoucher] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const subtotal = cart.reduce((acc, item) => {
        const price = item.discountPrice || item.price;
        return acc + (price * item.qty);
    }, 0);

    const handleApplyVoucher = async () => {
        if (!voucherCode) return;
        setLoadingVoucher(true);
        try {
            const res = await fetch(`/api/vouchers?vendorId=${vendor.id}`);
            if (res.ok) {
                const data = await res.json();
                const found = data.find(v => v.code === voucherCode);
                if (found) {
                    if (subtotal < found.minPurchase) {
                        alert(`Minimal belanja Rp ${fmt(found.minPurchase)} untuk voucher ini.`);
                        setAppliedVoucher(null);
                    } else {
                        setAppliedVoucher(found);
                        alert("Voucher berhasil dipasang!");
                    }
                } else {
                    alert("Kode voucher tidak valid.");
                    setAppliedVoucher(null);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Gagal mengecek voucher.");
        } finally {
            setLoadingVoucher(false);
        }
    };

    let discount = 0;
    if (appliedVoucher) {
        if (appliedVoucher.type === 'fixed') {
            discount = appliedVoucher.value;
        } else if (appliedVoucher.type === 'percentage') {
            discount = (subtotal * appliedVoucher.value) / 100;
            if (appliedVoucher.maxDiscount && discount > appliedVoucher.maxDiscount) {
                discount = appliedVoucher.maxDiscount;
            }
        }
    }
    const total = Math.max(0, subtotal - discount);

    const handleClose = () => {
        onClose();
        setAppliedVoucher(null);
        setVoucherCode('');
    };

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false);
        onClearCart?.();
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Sheet */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl pointer-events-auto max-h-[92vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingBag size={18} className="text-primary" />
                            <h3 className="font-serif font-bold text-lg text-gray-800">Keranjang Belanja</h3>
                            {cart.length > 0 && (
                                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto">

                        {/* Item List */}
                        <div className="p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">Keranjang kosong</p>
                                    <p className="text-sm">Yuk tambah produk dulu!</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {cart.map(item => {
                                        const unitPrice = item.discountPrice || item.price;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex gap-3 bg-gray-50 rounded-2xl p-3"
                                            >
                                                {/* Thumbnail */}
                                                <img
                                                    src={item.image}
                                                    className="w-14 h-14 rounded-xl object-cover bg-gray-200 flex-shrink-0"
                                                    onError={e => { e.target.style.display = 'none'; }}
                                                />

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{item.name}</h4>
                                                        {/* Hapus item */}
                                                        <button
                                                            onClick={() => onRemoveItem?.(item.id)}
                                                            className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 transition rounded-lg"
                                                            title="Hapus item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Harga satuan */}
                                                    <div className="flex items-center gap-1.5 mt-0.5 mb-2">
                                                        {item.discountPrice ? (
                                                            <>
                                                                <span className="text-[11px] text-gray-400 line-through">{fmt(item.price)}</span>
                                                                <span className="text-[12px] font-bold text-red-500">{fmt(item.discountPrice)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-[12px] text-gray-500">{fmt(item.price)}</span>
                                                        )}
                                                    </div>

                                                    {/* Kontrol qty + subtotal item */}
                                                    <div className="flex items-center justify-between">
                                                        {/* Tombol - qty + */}
                                                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                            <button
                                                                onClick={() => onUpdateQty?.(item.id, -1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-gray-500 transition"
                                                            >
                                                                <Minus size={13} />
                                                            </button>
                                                            <span className="w-6 text-center text-sm font-bold text-gray-800">
                                                                {item.qty}
                                                            </span>
                                                            <button
                                                                onClick={() => onUpdateQty?.(item.id, 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-green-50 hover:text-green-600 text-gray-500 transition"
                                                            >
                                                                <Plus size={13} />
                                                            </button>
                                                        </div>

                                                        {/* Subtotal item */}
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {fmtCurrency(unitPrice * item.qty)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Form Voucher + Nama + Catatan */}
                        {cart.length > 0 && (
                            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                                {/* Voucher */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kode Promo / Voucher</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={voucherCode}
                                            onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                                            placeholder="KODE PROMO"
                                            disabled={!!appliedVoucher}
                                        />
                                        {appliedVoucher ? (
                                            <button
                                                onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                                                className="bg-red-100 text-red-600 px-3 rounded-xl text-sm font-bold"
                                            >
                                                Hapus
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleApplyVoucher}
                                                disabled={!voucherCode || loadingVoucher}
                                                className="bg-gray-800 text-white px-4 rounded-xl text-xs font-bold disabled:opacity-40"
                                            >
                                                {loadingVoucher ? '...' : 'Pakai'}
                                            </button>
                                        )}
                                    </div>
                                    {appliedVoucher && (
                                        <p className="text-xs text-blue-600 mt-1 font-medium">
                                            🎉 Hemat {fmt(discount)}
                                        </p>
                                    )}
                                </div>

                                {/* Nama */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Pemesan</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Nama Anda..."
                                    />
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Catatan</label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        rows={2}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Jangan pedas, dll..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl flex-shrink-0">
                        {cart.length > 0 && (
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Subtotal ({cart.reduce((a, b) => a + b.qty, 0)} item)</span>
                                    <span>{fmt(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-blue-600 font-medium">
                                        <span>Diskon Voucher</span>
                                        <span>- {fmt(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="font-bold text-gray-800">Total Pembayaran</span>
                                    <span className="font-serif font-bold text-xl text-primary">{fmtCurrency(total)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {/* Tombol Batalkan */}
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="px-4 py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition flex items-center gap-1.5 flex-shrink-0"
                                >
                                    <Trash2 size={15} />
                                    Batalkan
                                </button>
                            )}

                            {/* Tombol Pesan */}
                            <button
                                onClick={() => onCheckout(name, note, appliedVoucher, discount)}
                                disabled={cart.length === 0 || !name}
                                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                            >
                                <span>Pesan via</span>
                                <MessageCircle size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modal Konfirmasi Batalkan */}
            {showCancelConfirm && (
                <ConfirmCancelModal
                    onConfirm={handleConfirmCancel}
                    onDismiss={() => setShowCancelConfirm(false)}
                />
            )}
        </>
    );
}
