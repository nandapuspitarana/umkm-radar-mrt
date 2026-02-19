import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

export default function KulinerBanners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.kuliner_banners) {
                let fetchedBanners = [];
                if (Array.isArray(data.kuliner_banners)) {
                    fetchedBanners = data.kuliner_banners;
                } else if (data.kuliner_banners.banners && Array.isArray(data.kuliner_banners.banners)) {
                    fetchedBanners = data.kuliner_banners.banners;
                }
                setBanners(fetchedBanners.length > 0 ? fetchedBanners : []);
            }
        } catch (error) {
            console.error('Failed to fetch banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBanner = () => {
        setBanners([...banners, {
            id: Date.now(),
            title: '',
            image: '',
            link: ''
        }]);
    };

    const handleRemoveBanner = (id) => {
        setBanners(banners.filter(b => b.id !== id));
    };

    const handleUpdateBanner = (id, field, value) => {
        setBanners(banners.map(b =>
            b.id === id ? { ...b, [field]: value } : b
        ));
    };

    const handleSave = async () => {
        // Validate: at least one banner must have an image
        const validBanners = banners.filter(b => b.image && b.image.trim() !== '');

        if (validBanners.length === 0) {
            alert('Minimal harus ada 1 banner dengan gambar!');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kuliner_banners: validBanners
                })
            });

            if (res.ok) {
                alert('Banner Kuliner berhasil disimpan!');
                fetchBanners(); // Refresh
            } else {
                alert('Gagal menyimpan banner');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Banner Kuliner</h1>
                        <p className="text-gray-500">Kelola banner horizontal di halaman Kuliner</p>
                    </div>
                    <button
                        onClick={handleAddBanner}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-bold"
                    >
                        <Plus size={18} />
                        Tambah Banner
                    </button>
                </header>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Memuat...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Preview Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-lg text-gray-800 mb-4">Preview Banner</h2>
                            <div className="overflow-x-auto no-scrollbar bg-gray-50 p-4 rounded-xl">
                                <div className="flex gap-2">
                                    {banners.filter(b => b.image).map((banner) => (
                                        <BannerPreview
                                            key={banner.id}
                                            banner={banner}
                                        />
                                    ))}
                                    {banners.filter(b => b.image).length === 0 && (
                                        <div className="w-full py-8 text-center text-gray-400">
                                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Belum ada banner dengan gambar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Rekomendasi ukuran: 128x96px (rasio 4:3)
                            </p>
                        </div>

                        {/* Banner List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-lg text-gray-800 mb-4">Daftar Banner</h2>

                            {banners.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                                    <p className="font-medium mb-2">Belum ada banner</p>
                                    <p className="text-sm">Klik "Tambah Banner" untuk memulai</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {banners.map((banner, index) => (
                                        <div
                                            key={banner.id}
                                            className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Drag Handle */}
                                                <div className="pt-2 cursor-move text-gray-400 hover:text-gray-600">
                                                    <GripVertical size={20} />
                                                </div>

                                                {/* Form Fields */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Judul banner (opsional)"
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={banner.title || ''}
                                                            onChange={(e) => handleUpdateBanner(banner.id, 'title', e.target.value)}
                                                        />
                                                    </div>

                                                    <ImageUploader
                                                        value={banner.image}
                                                        onChange={(url) => handleUpdateBanner(banner.id, 'image', url)}
                                                        category="banner"
                                                        placeholder="Upload gambar banner"
                                                    />

                                                    {/* Link Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Link Redirect (opsional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://example.com atau /vendor/123"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={banner.link || ''}
                                                            onChange={(e) => handleUpdateBanner(banner.id, 'link', e.target.value)}
                                                        />
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            💡 Banner akan redirect ke link ini saat diklik
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleRemoveBanner(banner.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Hapus banner"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || banners.filter(b => b.image).length === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition ${saving || banners.filter(b => b.image).length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                                    }`}
                            >
                                <Save size={18} />
                                {saving ? 'Menyimpan...' : 'Simpan Semua Banner'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Banner Preview Component with error handling
function BannerPreview({ banner }) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative bg-white shadow-sm border border-gray-200">
            {!imageError ? (
                <>
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    <img
                        src={banner.image}
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                        style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-xs">Error</span>
                </div>
            )}
            {banner.title && !imageError && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="bg-gray-100/90 px-2 py-1 rounded-lg">
                        <span className="text-xs font-semibold text-gray-700">{banner.title}</span>
                    </div>
                </div>
            )}
            {banner.link && !imageError && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full" title={`Link: ${banner.link}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </div>
            )}
        </div>
    );
}
