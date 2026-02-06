import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartSheet({ isOpen, onClose, cart, vendor, onCheckout }) {
    if (!isOpen) return null;

    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [loadingVoucher, setLoadingVoucher] = useState(false);

    const subtotal = cart.reduce((acc, item) => {
        // Use discountPrice if available, else price
        const price = item.discountPrice || item.price;
        return acc + (price * item.qty);
    }, 0);

    const handleApplyVoucher = async () => {
        if (!voucherCode) return;
        setLoadingVoucher(true);
        try {
            // Fetch vouchers for this vendor (or global) to check validity
            const res = await fetch(`/api/vouchers?vendorId=${vendor.id}`);
            if (res.ok) {
                const globalRes = await fetch(`/api/vouchers?vendorId=${vendor.id}`); // This endpoint returns filtered logic already
                // Actually my endpoint logic returns array.
                // Let's rely on backend filtering.
                // Wait, client fetching logic: fetch all available for this vendor context.
                // Then filter by code.

                const data = await res.json();
                const found = data.find(v => v.code === voucherCode);

                if (found) {
                    // Check constraints
                    if (subtotal < found.minPurchase) {
                        alert(`Minimal belanja Rp ${found.minPurchase} untuk voucher ini.`);
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

    // Calculate Discount
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

    // Prevent negative total
    const total = Math.max(0, subtotal - discount);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm"
                onClick={() => { onClose(); setAppliedVoucher(null); setVoucherCode(''); }}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col"
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-gray-800">Keranjang Belanja</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Keranjang kosong. Yuk jajan!
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4">
                                <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                                    <div className="flex flex-col mb-2">
                                        {item.discountPrice ? (
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text-gray-500 line-through">
                                                    {new Intl.NumberFormat('id-ID').format(item.price)}
                                                </span>
                                                <span className="text-xs font-bold text-red-600">
                                                    {new Intl.NumberFormat('id-ID').format(item.discountPrice)}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">x{item.qty}</span>
                                        <span className="text-sm font-bold text-gray-800 ml-auto">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((item.discountPrice || item.price) * item.qty)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {cart.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            {/* Voucher Input */}
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
                                            className="bg-gray-800 text-white px-4 rounded-xl text-xs font-bold"
                                        >
                                            {loadingVoucher ? '...' : 'Pakai'}
                                        </button>
                                    )}
                                </div>
                                {appliedVoucher && (
                                    <p className="text-xs text-blue-600 mt-1 font-medium">Voucher diterapkan! Hemat {new Intl.NumberFormat('id-ID').format(discount)}</p>
                                )}
                            </div>

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

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl">
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>{new Intl.NumberFormat('id-ID').format(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-sm text-blue-600 font-medium">
                                <span>Diskon Voucher</span>
                                <span>- {new Intl.NumberFormat('id-ID').format(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-800">Total Pembayaran</span>
                            <span className="font-serif font-bold text-xl text-primary">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => onCheckout(name, note, appliedVoucher, discount)} // Pass voucher data
                        disabled={cart.length === 0 || !name}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <span>Pesan</span>
                        {/* pesan via whatsapp */}
                        <MessageCircle size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
