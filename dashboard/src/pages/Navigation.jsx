import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Menu, Eye, EyeOff, GripVertical, ExternalLink, Lock } from 'lucide-react';

export default function Navigation() {
    const [navItems, setNavItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState('all'); // all, header, footer, sidebar
    const [formData, setFormData] = useState({
        label: '',
        path: '',
        icon: '',
        parentId: null,
        position: 'header',
        sortOrder: 0,
        isExternal: false,
        isVisible: true,
        requiresAuth: false
    });

    useEffect(() => {
        fetchNavItems();
    }, [selectedPosition]);

    const fetchNavItems = async () => {
        try {
            const url = selectedPosition === 'all'
                ? '/api/navigation'
                : `/api/navigation?position=${selectedPosition}`;
            const res = await fetch(url);
            const data = await res.json();
            setNavItems(data);
        } catch (error) {
            console.error('Failed to fetch navigation items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/navigation/${editingId}` : '/api/navigation';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchNavItems();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save navigation item:', error);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            label: item.label,
            path: item.path,
            icon: item.icon || '',
            parentId: item.parentId,
            position: item.position,
            sortOrder: item.sortOrder || 0,
            isExternal: item.isExternal,
            isVisible: item.isVisible,
            requiresAuth: item.requiresAuth
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus item navigasi ini?')) return;

        try {
            const res = await fetch(`/api/navigation/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchNavItems();
            }
        } catch (error) {
            console.error('Failed to delete navigation item:', error);
        }
    };

    const toggleVisibility = async (item) => {
        try {
            const res = await fetch(`/api/navigation/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, isVisible: !item.isVisible })
            });
            if (res.ok) {
                fetchNavItems();
            }
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            path: '',
            icon: '',
            parentId: null,
            position: 'header',
            sortOrder: 0,
            isExternal: false,
            isVisible: true,
            requiresAuth: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    // Get parent items for dropdown (only top-level items)
    const parentItems = navItems.filter(item => !item.parentId);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Navigasi</h1>
                    <p className="text-sm text-gray-600 mt-1">Kelola menu navigasi untuk header, footer, dan sidebar</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors font-medium"
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Batal' : 'Tambah Menu'}
                </button>
            </div>

            {/* Position Filter */}
            <div className="mb-6 flex gap-2">
                {['all', 'header', 'footer', 'sidebar'].map(pos => (
                    <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${selectedPosition === pos
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {pos === 'all' ? 'Semua' : pos}
                    </button>
                ))}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Menu size={20} className="text-blue-600" />
                        {editingId ? 'Edit Menu' : 'Tambah Menu Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Label */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label Menu *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Beranda, Tentang Kami"
                                />
                            </div>

                            {/* Path */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Path / URL *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.path}
                                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    placeholder="e.g. /, /about, https://..."
                                />
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Icon (emoji atau nama icon)
                                </label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="🏠 atau home"
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Posisi *
                                </label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="header">Header</option>
                                    <option value="footer">Footer</option>
                                    <option value="sidebar">Sidebar</option>
                                </select>
                            </div>

                            {/* Parent Menu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parent Menu (opsional)
                                </label>
                                <select
                                    value={formData.parentId || ''}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Tidak ada (Top Level)</option>
                                    {parentItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Urutan Tampilan
                                </label>
                                <input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isExternal}
                                    onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <ExternalLink size={14} />
                                    Link Eksternal
                                </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isVisible}
                                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <Eye size={14} />
                                    Tampilkan
                                </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresAuth}
                                    onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <Lock size={14} />
                                    Perlu Login
                                </span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? 'Update' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Navigation Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <GripVertical size={16} className="inline" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Menu
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Path
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Posisi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {navItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <Menu size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium">Belum ada menu navigasi</p>
                                        <p className="text-sm mt-1">Klik "Tambah Menu" untuk membuat menu baru</p>
                                    </td>
                                </tr>
                            ) : (
                                navItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.sortOrder}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.icon && (
                                                    <span className="text-xl">{item.icon}</span>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                        {item.label}
                                                        {item.isExternal && <ExternalLink size={12} className="text-gray-400" />}
                                                        {item.requiresAuth && <Lock size={12} className="text-gray-400" />}
                                                    </div>
                                                    {item.parentId && (
                                                        <div className="text-xs text-gray-500">
                                                            Sub-menu dari: {navItems.find(p => p.id === item.parentId)?.label}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.path}</code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                {item.position}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleVisibility(item)}
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.isVisible
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {item.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {item.isVisible ? 'Tampil' : 'Tersembunyi'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    <strong>💡 Tips:</strong> Menu navigasi dapat ditampilkan di header, footer, atau sidebar.
                    Gunakan "Parent Menu" untuk membuat sub-menu dropdown. Urutan tampilan menentukan posisi menu (angka lebih kecil = lebih kiri/atas).
                </p>
            </div>
        </div>
    );
}
