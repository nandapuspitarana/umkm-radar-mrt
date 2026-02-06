import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, Package, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        discountPrice: '',
        category: 'Sayuran',
        image: '',
        description: '',
        isAvailable: true
    });

    const categories = ['Sayuran', 'Buah', 'Daging', 'Bumbu', 'Lainnya'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products?vendorId=${auth.vendorId}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            vendorId: auth.vendorId,
            price: parseInt(formData.price),
            discountPrice: formData.discountPrice ? parseInt(formData.discountPrice) : null
        };

        try {
            const url = isEditing
                ? `/api/products/${currentItem.id}`
                : '/api/products';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isEditing ? "Produk diperbarui!" : "Produk ditambahkan!");
                setShowModal(false);
                fetchProducts();
                resetForm();
            } else {
                alert("Gagal menyimpan produk.");
            }
        } catch (error) {
            alert("Kesalahan koneksi.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin hapus produk ini?")) return;
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            fetchProducts();
        } catch (error) {
            alert("Gagal menghapus.");
        }
    };

    const openEdit = (item) => {
        setIsEditing(true);
        setCurrentItem(item);
        setFormData({
            name: item.name,
            price: item.price,
            discountPrice: item.discountPrice || '',
            category: item.category,
            image: item.image,
            description: item.description || '',
            isAvailable: item.isAvailable
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentItem(null);
        setFormData({
            name: '',
            price: '',
            discountPrice: '',
            category: 'Sayuran',
            image: '',
            description: '',
            isAvailable: true
        });
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk</h1>
                        <p className="text-gray-500">Kelola katalog produk toko Anda.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-800"
                    >
                        <Plus size={18} /> Tambah Produk
                    </button>
                </header>

                {/* Product Grid */}
                <div className="grid grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                            <div className="relative h-40 bg-gray-100">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                {!product.isAvailable && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                                        Stok Habis
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">{product.category}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    {product.discountPrice ? (
                                        <>
                                            <span className="text-lg font-bold text-red-600">{new Intl.NumberFormat('id-ID').format(product.discountPrice)}</span>
                                            <span className="text-sm text-gray-400 line-through">{new Intl.NumberFormat('id-ID').format(product.price)}</span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-bold text-gray-800">{new Intl.NumberFormat('id-ID').format(product.price)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Form */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-6">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                                    <input id="name" required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Harga Asli</label>
                                        <input id="price" required type="number" className="w-full p-2 border rounded-lg" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">Harga Diskon (Opsional)</label>
                                        <input id="discountPrice" type="number" className="w-full p-2 border rounded-lg" placeholder="Kosongkan jika tidak ada" value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select id="category" className="w-full p-2 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">URL Gambar (Sementara)</label>
                                    <input id="image" required type="text" className="w-full p-2 border rounded-lg" placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                    <textarea id="description" className="w-full p-2 border rounded-lg" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="avail" className="w-4 h-4" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} />
                                    <label htmlFor="avail" className="text-sm font-medium text-gray-700">Produk Tersedia (Stok Ada)</label>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
