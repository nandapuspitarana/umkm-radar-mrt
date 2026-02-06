import React, { useState, useEffect } from 'react';
import { Save, FileText, Globe, Store, Upload, X, MapPin, Image, Train, Plus, Trash2, GripVertical, Link } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ImageUploader from '../components/ImageUploader';

export default function Settings() {
    const [activeTab, setActiveTab] = useState(''); // general | pages | profile | banners | transport
    const [imageInputType, setImageInputType] = useState('url'); // url | upload

    // Handle File Upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setVendorProfile(prev => ({ ...prev, image: data.url }));
            } else {
                alert("Upload gagal");
            }
        } catch (error) {
            console.error(error);
            alert("Error upload");
        } finally {
            setLoading(false);
        }
    };

    // Settings state
    const [settings, setSettings] = useState({
        app_logo: '',
        footer_text: '',
        footer_links: []
    });

    // Banner Story State
    const [banners, setBanners] = useState([]);

    // Transport Links State
    const [transportLinks, setTransportLinks] = useState([]);

    // Vendor Profile State
    const [vendorProfile, setVendorProfile] = useState({
        name: '',
        address: '',
        whatsapp: '',
        lat: '',
        lng: '',
        image: '' // Optional logo logic
    });

    // Auth
    const [auth] = useState(JSON.parse(localStorage.getItem('grocries_auth') || '{}'));
    const isVendor = auth.role === 'vendor';

    // Page Content State
    const [pages, setPages] = useState({
        page_about: '',
        page_terms: '',
        page_privacy: ''
    });
    const [selectedPage, setSelectedPage] = useState('page_about');

    const [loading, setLoading] = useState(false);

    // Fetch Settings
    useEffect(() => {
        // Global Settings (Everyone needs this or just admin? Front store needs it, so public)
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings({
                    app_logo: data.app_logo || '',
                    footer_text: data.footer_text || '',
                    footer_links: data.footer_links || []
                });
                setPages({
                    page_about: data.page_about || '',
                    page_terms: data.page_terms || '',
                    page_privacy: data.page_privacy || ''
                });
                // Load banners from database (no hardcode fallback)
                const fixedBanners = (data.homepage_banners || []).map(b => ({
                    ...b,
                    image: b.image && b.image.startsWith('/assets/homepage/')
                        ? b.image.replace('/assets/homepage/', '/api/files/assets/homepage/')
                        : b.image
                }));
                setBanners(fixedBanners);

                // Load transport links from database (no hardcode fallback)
                const fixedLinks = (data.transport_links || []).map(link => ({
                    ...link,
                    logo: link.logo && link.logo.startsWith('/assets/homepage/')
                        ? link.logo.replace('/assets/homepage/', '/api/files/assets/homepage/')
                        : link.logo
                }));
                setTransportLinks(fixedLinks);
            })
            .catch(err => console.error("Failed to load settings", err));

        // Vendor Data
        if (isVendor && auth.vendorId) {
            fetch(`/api/vendors/${auth.vendorId}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setVendorProfile({
                            name: data.name,
                            address: data.address,
                            whatsapp: data.whatsapp,
                            lat: data.lat,
                            lng: data.lng,
                            image: data.image || ''
                        });
                    }
                })
                .catch(err => console.error(err));
        }

        // Initial Tab
        if (!activeTab) {
            setActiveTab(isVendor ? 'profile' : 'banners');
        }

    }, [auth, isVendor, activeTab]);

    const handleSave = async (dataToSave) => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (res.ok) {
                alert("Berhasil disimpan!");
            } else {
                alert("Gagal menyimpan.");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVendor = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vendors/${auth.vendorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendorProfile)
            });
            if (res.ok) alert("Profil Toko diperbarui!");
            else alert("Gagal update profil.");
        } catch (e) {
            alert("Error koneksi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = () => handleSave(settings);
    const handleSavePages = () => handleSave(pages);
    const handleSaveBanners = () => handleSave({ homepage_banners: banners });
    const handleSaveTransport = () => handleSave({ transport_links: transportLinks });

    // General Logic
    const addLink = () => {
        setSettings(prev => ({
            ...prev,
            footer_links: [...prev.footer_links, { label: 'New Link', url: '#' }]
        }));
    };

    const updateLink = (index, key, value) => {
        const newLinks = [...settings.footer_links];
        newLinks[index][key] = value;
        setSettings(prev => ({ ...prev, footer_links: newLinks }));
    };

    const removeLink = (index) => {
        const newLinks = settings.footer_links.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, footer_links: newLinks }));
    };

    // Banner Logic
    const addBanner = () => {
        setBanners(prev => [...prev, {
            id: Date.now(),
            image: '',
            title: '',
            subtitle: ''
        }]);
    };

    const updateBanner = (index, key, value) => {
        const newBanners = [...banners];
        newBanners[index][key] = value;
        setBanners(newBanners);
    };

    const removeBanner = (index) => {
        setBanners(prev => prev.filter((_, i) => i !== index));
    };

    // Transport Link Logic
    const addTransportLink = () => {
        setTransportLinks(prev => [...prev, {
            id: Date.now().toString(),
            name: '',
            logo: '',
            url: ''
        }]);
    };

    const updateTransportLink = (index, key, value) => {
        const newLinks = [...transportLinks];
        newLinks[index][key] = value;
        setTransportLinks(newLinks);
    };

    const removeTransportLink = (index) => {
        setTransportLinks(prev => prev.filter((_, i) => i !== index));
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setVendorProfile(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                    setLoading(false);
                    alert("Lokasi berhasil ditemukan!");
                },
                (error) => {
                    console.error(error);
                    setLoading(false);
                    alert("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
                }
            );
        } else {
            alert("Browser tidak mendukung geolokasi.");
        }
    };


    return (
        <div className="flex bg-bg min-h-screen">
            <Sidebar />
            <div className="flex-1 p-8 ml-64">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Pengaturan {isVendor ? 'Toko' : 'Website'}</h1>
                    <p className="text-gray-500">{isVendor ? 'Kelola informasi toko Anda.' : 'Kelola konten dan konfigurasi website.'}</p>
                </header>

                <div className="flex gap-4 mb-6 flex-wrap">
                    {isVendor && (
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Store size={18} />
                            Profil Toko
                        </button>
                    )}

                    {auth.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('banners')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'banners' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Image size={18} />
                                Banner Story
                            </button>
                            <button
                                onClick={() => setActiveTab('transport')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'transport' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Train size={18} />
                                Transport Links
                            </button>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Globe size={18} />
                                Umum & Footer
                            </button>
                            <button
                                onClick={() => setActiveTab('pages')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'pages' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                            >
                                <FileText size={18} />
                                Halaman (CMS)
                            </button>
                        </>
                    )}
                </div>

                {/* BANNER STORY MANAGEMENT */}
                {activeTab === 'banners' && auth.role === 'admin' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-4xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">Banner Story Homepage</h2>
                                <p className="text-sm text-gray-500">Kelola gambar story portrait di homepage. Rasio yang direkomendasikan: 9:16 (portrait)</p>
                            </div>
                            <button
                                onClick={addBanner}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Tambah Banner
                            </button>
                        </div>

                        {banners.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Image size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-medium">Belum ada banner story</p>
                                <p className="text-sm">Klik "Tambah Banner" untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {banners.map((banner, index) => (
                                    <div key={banner.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative group">
                                        {/* Form Fields */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Gambar Banner (9:16)</label>
                                                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 relative">
                                                    {banner.image ? (
                                                        (banner.image.match(/\.(mp4|webm|mov)$/i) || banner.image.includes('data:video')) ? (
                                                            <video
                                                                src={banner.image}
                                                                className="w-full h-full object-cover"
                                                                controls
                                                                muted
                                                            />
                                                        ) : (
                                                            <img
                                                                src={banner.image}
                                                                alt={banner.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        )
                                                    ) : null}
                                                    <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-400 ${banner.image ? 'hidden' : 'flex'}`}>
                                                        <Image size={32} />
                                                        <p className="text-xs mt-2">Media tidak tersedia</p>
                                                    </div>
                                                    {/* Overlay with title/subtitle */}
                                                    {banner.image && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
                                                            <p className="text-white font-bold text-sm truncate">{banner.title || 'Judul'}</p>
                                                            <p className="text-white/80 text-xs truncate">{banner.subtitle || 'Subjudul'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">URL atau Upload</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="URL gambar..."
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        value={banner.image}
                                                        onChange={(e) => updateBanner(index, 'image', e.target.value)}
                                                    />
                                                    <label className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 text-sm font-medium">
                                                        <Upload size={16} />
                                                        <input
                                                            type="file"
                                                            accept="image/*,video/mp4,video/webm"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                const formData = new FormData();
                                                                formData.append('file', file);
                                                                formData.append('category', 'banner');
                                                                try {
                                                                    const res = await fetch('/api/assets/upload', { method: 'POST', body: formData });
                                                                    const data = await res.json();
                                                                    if (data.directUrl) updateBanner(index, 'image', data.directUrl);
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Judul"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                value={banner.title}
                                                onChange={(e) => updateBanner(index, 'title', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Subjudul"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                value={banner.subtitle}
                                                onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                                            />
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removeBanner(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                            <button
                                onClick={handleSaveBanners}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                <Save size={18} />
                                {loading ? 'Menyimpan...' : 'Simpan Banner'}
                            </button>
                        </div>
                    </div>
                )}

                {/* TRANSPORT LINKS MANAGEMENT */}
                {activeTab === 'transport' && auth.role === 'admin' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-4xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">Transport Links</h2>
                                <p className="text-sm text-gray-500">Kelola link transportasi di homepage (TransJakarta, MRT, LRT, dll)</p>
                            </div>
                            <button
                                onClick={addTransportLink}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Tambah
                            </button>
                        </div>

                        <div className="space-y-4">
                            {transportLinks.map((link, index) => (
                                <div key={link.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex gap-4 items-center group">
                                    {/* Drag Handle */}
                                    <div className="text-gray-400 cursor-grab">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Logo Preview */}
                                    <div className="w-20 h-16 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {link.logo ? (
                                            <img
                                                src={link.logo}
                                                alt={link.name}
                                                className="max-h-12 max-w-full object-contain"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        ) : (
                                            <Train size={24} className="text-gray-400" />
                                        )}
                                    </div>

                                    {/* Form Fields */}
                                    <div className="flex-1 space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Nama (mis: TransJakarta)"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                value={link.name}
                                                onChange={(e) => updateTransportLink(index, 'name', e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Link Redirect (https://...)"
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                    value={link.url}
                                                    onChange={(e) => updateTransportLink(index, 'url', e.target.value)}
                                                />
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                                                >
                                                    <Link size={16} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="URL Logo (atau upload)"
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                value={link.logo}
                                                onChange={(e) => updateTransportLink(index, 'logo', e.target.value)}
                                            />
                                            <label className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 text-sm font-medium">
                                                <Upload size={16} /> Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        formData.append('category', 'logo');
                                                        try {
                                                            const res = await fetch('/api/assets/upload', { method: 'POST', body: formData });
                                                            const data = await res.json();
                                                            if (data.directUrl) updateTransportLink(index, 'logo', data.directUrl);
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeTransportLink(index)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                            <button
                                onClick={handleSaveTransport}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                <Save size={18} />
                                {loading ? 'Menyimpan...' : 'Simpan Transport Links'}
                            </button>
                        </div>
                    </div>
                )}

                {/* VENDOR PROFILE */}
                {activeTab === 'profile' && isVendor && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-2xl animate-fade-in">
                        <h2 className="font-bold text-lg mb-6 text-gray-800">Edit Informasi Toko</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                                <input type="text" className="w-full border rounded-lg px-3 py-2" value={vendorProfile.name} onChange={e => setVendorProfile({ ...vendorProfile, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                <textarea rows="2" className="w-full border rounded-lg px-3 py-2" value={vendorProfile.address} onChange={e => setVendorProfile({ ...vendorProfile, address: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp (628...)</label>
                                <input type="text" className="w-full border rounded-lg px-3 py-2" value={vendorProfile.whatsapp} onChange={e => setVendorProfile({ ...vendorProfile, whatsapp: e.target.value.replace(/\D/g, '') })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Foto Toko</label>

                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="imgType"
                                            checked={imageInputType === 'url'}
                                            onChange={() => setImageInputType('url')}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm">Link URL</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="imgType"
                                            checked={imageInputType === 'upload'}
                                            onChange={() => setImageInputType('upload')}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm">Upload Gambar</span>
                                    </label>
                                </div>

                                {imageInputType === 'url' ? (
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="https://..."
                                        value={vendorProfile.image}
                                        onChange={e => setVendorProfile({ ...vendorProfile, image: e.target.value })}
                                    />
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="fileUpload"
                                            onChange={handleFileUpload}
                                        />
                                        <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <Upload size={20} />
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">Klik untuk upload atau ambil foto</span>
                                            <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                                        </label>
                                    </div>
                                )}

                                {vendorProfile.image && (
                                    <div className="mt-3 relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group">
                                        <img src={vendorProfile.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setVendorProfile({ ...vendorProfile, image: '' })}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-gray-800 mb-4">Jam Operasional</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Hari Buka</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day, idx) => (
                                                <label key={day} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-sm transition-all ${vendorProfile.schedule?.days?.includes(idx) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={vendorProfile.schedule?.days?.includes(idx) || false}
                                                        onChange={(e) => {
                                                            const currentDays = vendorProfile.schedule?.days || [];
                                                            const newDays = e.target.checked
                                                                ? [...currentDays, idx].sort()
                                                                : currentDays.filter(d => d !== idx);
                                                            setVendorProfile({ ...vendorProfile, schedule: { ...(vendorProfile.schedule || {}), days: newDays } });
                                                        }}
                                                    />
                                                    {day}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Buka</label>
                                            <input
                                                type="time"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={vendorProfile.schedule?.openTime || '08:00'}
                                                onChange={e => setVendorProfile({ ...vendorProfile, schedule: { ...(vendorProfile.schedule || {}), openTime: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Tutup</label>
                                            <input
                                                type="time"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={vendorProfile.schedule?.closeTime || '17:00'}
                                                onChange={e => setVendorProfile({ ...vendorProfile, schedule: { ...(vendorProfile.schedule || {}), closeTime: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="holidayClosed"
                                            className="w-4 h-4 text-blue-600 rounded"
                                            checked={vendorProfile.schedule?.holidayClosed || false}
                                            onChange={e => setVendorProfile({ ...vendorProfile, schedule: { ...(vendorProfile.schedule || {}), holidayClosed: e.target.checked } })}
                                        />
                                        <label htmlFor="holidayClosed" className="text-sm text-gray-700">Tutup pada Tanggal Merah / Hari Libur Nasional</label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input type="number" className="w-full border rounded-lg px-3 py-2" value={vendorProfile.lat} onChange={e => setVendorProfile({ ...vendorProfile, lat: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input type="number" className="w-full border rounded-lg px-3 py-2" value={vendorProfile.lng} onChange={e => setVendorProfile({ ...vendorProfile, lng: parseFloat(e.target.value) })} />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        onClick={handleGetCurrentLocation}
                                        className="w-full bg-blue-50 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-medium"
                                    >
                                        <MapPin size={18} />
                                        Gunakan Lokasi Saat Ini (Via GPS)
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSaveVendor}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    Simpan Profil
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-3xl animate-fade-in">
                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                            Pengaturan Umum & Branding
                        </h2>

                        {/* Logo Section */}
                        <div className="mb-8 pb-8 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-2">Logo Website</h3>
                            <p className="text-sm text-gray-500 mb-4">Logo akan ditampilkan di header homepage. Ukuran yang direkomendasikan: 48x48px atau rasio 1:1</p>
                            <ImageUploader
                                value={settings.app_logo}
                                onChange={(url) => setSettings({ ...settings, app_logo: url })}
                                category="logo"
                                placeholder="Upload logo atau masukkan URL"
                            />
                        </div>

                        {/* Footer Configuration */}
                        <h3 className="font-bold text-gray-800 mb-4">
                            Konfigurasi Footer
                        </h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Teks Copyright</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                value={settings.footer_text}
                                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                placeholder="Contoh: © 2024 UMKM Radar. All rights reserved."
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Link Footer Tambahan</label>
                            <div className="space-y-3">
                                {settings.footer_links.map((link, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={link.label}
                                            onChange={(e) => updateLink(index, 'label', e.target.value)}
                                            placeholder="Label Link"
                                        />
                                        <input
                                            type="text"
                                            className="flex-[2] border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={link.url}
                                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                                            placeholder="URL (https://...)"
                                        />
                                        <button
                                            onClick={() => removeLink(index)}
                                            className="text-red-500 hover:bg-red-50 px-3 rounded-xl border border-transparent hover:border-red-100 transition-all font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addLink}
                                className="text-sm text-blue-700 font-bold bg-blue-50 px-4 py-2 rounded-xl mt-3 hover:bg-blue-100 transition-colors"
                            >
                                + Tambah Link Baru
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSaveGeneral}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                <Save size={18} />
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                )}

                {/* PAGES CMS */}
                {activeTab === 'pages' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-4xl animate-fade-in">
                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                            Editor Halaman
                        </h2>

                        <div className="flex gap-6">
                            <div className="w-1/4 space-y-2">
                                {[
                                    { id: 'page_about', label: 'Tentang Kami' },
                                    { id: 'page_terms', label: 'Syarat & Ketentuan' },
                                    { id: 'page_privacy', label: 'Kebijakan Privasi' }
                                ].map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => setSelectedPage(page.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${selectedPage === page.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                                    >
                                        {page.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Konten Halaman</label>
                                <textarea
                                    className="w-full h-96 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed resize-none"
                                    value={pages[selectedPage]}
                                    onChange={(e) => setPages({ ...pages, [selectedPage]: e.target.value })}
                                    placeholder="Tulis konten halaman di sini... (Mendukung teks biasa)"
                                ></textarea>
                                <p className="text-xs text-gray-400 mt-2 text-right">Mendukung format teks sederhana.</p>

                                <div className="mt-6 flex justify-end gap-3">
                                    <a
                                        href={`http://localhost:8082/${selectedPage.replace('page_', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        Preview
                                    </a>
                                    <button
                                        onClick={handleSavePages}
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                                    >
                                        <Save size={18} />
                                        Simpan Halaman
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

// Simple styles for fade animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);
