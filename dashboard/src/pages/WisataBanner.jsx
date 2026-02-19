import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

export default function WisataBanner() {
    const [bannerUrl, setBannerUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.wisata_banner) {
                setBannerUrl(data.wisata_banner);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wisata_banner: bannerUrl
                })
            });

            if (res.ok) {
                alert('Banner berhasil disimpan!');
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

    const renderPreview = () => {
        if (!bannerUrl) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-sm">Belum ada banner</p>
                </div>
            );
        }

        const videoId = getYouTubeVideoId(bannerUrl);

        if (videoId) {
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Banner Video Preview"
                />
            );
        } else if (bannerUrl.endsWith('.mp4') || bannerUrl.endsWith('.webm')) {
            return (
                <video
                    src={bannerUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            );
        } else {
            return (
                <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop';
                    }}
                />
            );
        }
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Banner Halaman Wisata</h1>
                    <p className="text-gray-500">Kelola banner yang ditampilkan di halaman Tempat Wisata Jakarta</p>
                </header>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Memuat...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="space-y-6">
                            {/* Banner Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preview Banner
                                </label>
                                <div className="relative w-full max-w-[600px] aspect-[3/2] max-h-[200px] bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                                    {renderPreview()}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Rekomendasi ukuran: 600x400px (rasio 3:2)
                                </p>
                            </div>

                            {/* Image Uploader */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Banner Baru
                                </label>
                                <ImageUploader
                                    value={bannerUrl}
                                    onChange={(url) => setBannerUrl(url)}
                                    category="banner"
                                    placeholder="Upload gambar atau video"
                                />
                            </div>

                            {/* Manual URL Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Atau Masukkan URL Gambar / Video YouTube
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="https://example.com/image.jpg atau https://youtu.be/VIDEO_ID"
                                    value={bannerUrl}
                                    onChange={(e) => setBannerUrl(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Tip: Anda bisa memasukkan URL YouTube (contoh: https://youtu.be/nz-iEMFC9KU)
                                </p>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !bannerUrl}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold shadow-lg transition ${saving || !bannerUrl
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20'
                                        }`}
                                >
                                    <Save size={18} />
                                    {saving ? 'Menyimpan...' : 'Simpan Banner'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
