import React, { useState, useEffect, useCallback } from 'react';
import {
    Upload, Trash2, Copy, Check, Filter,
    Grid, List, Loader2, X, FolderOpen
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Assets() {
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [copiedId, setCopiedId] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [uploadCategory, setUploadCategory] = useState('general');

    const categories = [
        { value: '', label: 'Semua' },
        { value: 'banner', label: 'Banner' },
        { value: 'logo', label: 'Logo' },
        { value: 'product', label: 'Produk' },
        { value: 'general', label: 'Umum' },
    ];

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedCategory
                ? `/api/assets?category=${selectedCategory}`
                : '/api/assets';
            const res = await fetch(url);
            const data = await res.json();
            setAssets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch assets:', err);
        }
        setLoading(false);
    }, [selectedCategory]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', uploadCategory);
            formData.append('alt', file.name);
            try {
                await fetch('/api/assets/upload', { method: 'POST', body: formData });
            } catch (err) {
                console.error('Upload error:', err);
            }
        }
        setUploading(false);
        fetchAssets();
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus aset ini?')) return;
        try {
            await fetch(`/api/assets/${id}`, { method: 'DELETE' });
            fetchAssets();
            if (selectedAsset?.id === id) setSelectedAsset(null);
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const copyToClipboard = (url, id) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (auth.role !== 'admin') {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-64 p-6 text-center text-gray-500">
                    Hanya admin yang dapat mengakses halaman ini.
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Asset Manager</h1>
                        <p className="text-gray-500 text-sm">Kelola gambar dan media dengan MinIO + imgproxy</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                            ) : (
                                <Upload className="w-8 h-8 text-green-600" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700">
                                {uploading ? 'Mengupload...' : 'Drag & drop file di sini'}
                            </p>
                            <p className="text-sm text-gray-500">atau klik untuk browse</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="banner">Banner</option>
                                <option value="logo">Logo</option>
                                <option value="product">Produk</option>
                                <option value="general">Umum</option>
                            </select>
                            <label className="px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 flex items-center gap-2">
                                <Upload size={18} />
                                Upload File
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleUpload(Array.from(e.target.files))}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-3 py-1 rounded-full text-sm ${selectedCategory === cat.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Assets Grid/List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Belum ada aset. Upload file untuk memulai.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                className={`bg-white rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${selectedAsset?.id === asset.id ? 'ring-2 ring-green-500' : ''}`}
                                onClick={() => setSelectedAsset(asset)}
                            >
                                <div className="aspect-square bg-gray-100 relative">
                                    <img
                                        src={asset.thumbnailUrl}
                                        alt={asset.alt || asset.filename}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = asset.directUrl; }}
                                    />
                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                                        {asset.category}
                                    </span>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs truncate text-gray-700">{asset.filename}</p>
                                    <p className="text-xs text-gray-500">{formatSize(asset.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Preview</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Nama File</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Kategori</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ukuran</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <img
                                                src={asset.thumbnailUrl}
                                                alt={asset.filename}
                                                className="w-12 h-12 object-cover rounded"
                                                onError={(e) => { e.target.src = asset.directUrl; }}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm">{asset.filename}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 text-xs bg-gray-100 rounded">{asset.category}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{formatSize(asset.size)}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => copyToClipboard(asset.directUrl, asset.id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded"
                                                    title="Copy URL"
                                                >
                                                    {copiedId === asset.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Asset Detail Modal */}
                {selectedAsset && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-bold">Detail Aset</h3>
                                <button onClick={() => setSelectedAsset(null)} className="p-1 hover:bg-gray-100 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-100 rounded-xl overflow-hidden">
                                    <img
                                        src={selectedAsset.directUrl}
                                        alt={selectedAsset.filename}
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Nama File</label>
                                        <p className="font-medium">{selectedAsset.filename}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Kategori</label>
                                        <p>{selectedAsset.category}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Ukuran</label>
                                        <p>{formatSize(selectedAsset.size)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">URL Langsung</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedAsset.directUrl}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(selectedAsset.directUrl, 'direct')}
                                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                {copiedId === 'direct' ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">imgproxy URL (Auto WebP)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedAsset.imgproxyUrl}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(selectedAsset.imgproxyUrl, 'imgproxy')}
                                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                {copiedId === 'imgproxy' ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Thumbnail URL (200x200)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedAsset.thumbnailUrl}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(selectedAsset.thumbnailUrl, 'thumb')}
                                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                {copiedId === 'thumb' ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(selectedAsset.id)}
                                        className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Hapus Aset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
