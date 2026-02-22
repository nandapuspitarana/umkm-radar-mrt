import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Save, Upload, RefreshCw, CheckCircle } from 'lucide-react';

// Default transport icons (static SVG dari public/)
const TRANSPORT_DEFAULTS = [
    {
        id: 'MRT',
        label: 'MRT Jakarta',
        description: 'Mass Rapid Transit — dipakai di semua stasiun MRT',
        defaultPath: '/assets/transport/mrt-logo.svg',
        svgPath: '',
    },
    {
        id: 'TiJe',
        label: 'TransJakarta',
        description: 'Bus Transjakarta / Halte TiJe',
        defaultPath: '/assets/transport/tije-logo.svg',
        svgPath: '',
    },
    {
        id: 'JakLingko',
        label: 'JakLingko',
        description: 'Integrasi transportasi Jakarta',
        defaultPath: '/assets/transport/jaklingko-logo.svg',
        svgPath: '',
    },
    {
        id: 'KAI',
        label: 'KAI Commuter',
        description: 'Kereta Commuter Line Jabodetabek',
        defaultPath: '/assets/transport/kai-commuter-logo.svg',
        svgPath: '',
    },
    {
        id: 'LRT',
        label: 'LRT Jakarta/Jabodebek',
        description: 'Light Rail Transit',
        defaultPath: '/assets/transport/lrt-logo.svg',
        svgPath: '',
    },
    {
        id: 'Whoosh',
        label: 'Whoosh (KCIC)',
        description: 'Kereta Cepat Jakarta-Bandung',
        defaultPath: '/assets/transport/whoosh-logo.svg',
        svgPath: '',
    },
];

function TransportIconPreview({ svgPath, defaultPath, size = 40 }) {
    // Resolve custom path ke URL yang bisa diakses dari dashboard
    const customUrl = svgPath
        ? (svgPath.startsWith('http') ? svgPath : `/api/raw/${svgPath.replace(/^\//, '')}`)
        : null;

    const [useFallback, setUseFallback] = useState(false);
    const src = (!useFallback && customUrl) ? customUrl : defaultPath;

    // Reset state ketika svgPath berubah
    useEffect(() => { setUseFallback(false); }, [svgPath]);

    if (!src) {
        return (
            <div
                className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-lg"
                style={{ width: size, height: size }}
            >
                ?
            </div>
        );
    }

    return (
        <img
            key={src}
            src={src}
            alt=""
            style={{ width: size, height: size }}
            className="object-contain"
            onError={() => {
                if (!useFallback && customUrl) {
                    // custom URL gagal → coba defaultPath
                    setUseFallback(true);
                }
            }}
        />
    );
}

export default function TransportIcons() {
    const [icons, setIcons] = useState(TRANSPORT_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // id of item being saved
    const [saved, setSaved] = useState(null);   // id of item just saved
    const [uploading, setUploading] = useState(null); // id of item being uploaded
    const fileInputRefs = useRef({});

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                const stored = data.transport_icons || {};
                setIcons(prev => prev.map(item => ({
                    ...item,
                    svgPath: stored[item.id] || '',
                })));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleUpload = async (id, file) => {
        if (!file) return;
        setUploading(id);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            const rawPath = (data.url || '')
                .replace(/^\/api\/raw\//, '')
                .replace(/^\/api\/image\//, '');
            setIcons(prev => prev.map(item =>
                item.id === id ? { ...item, svgPath: rawPath } : item
            ));
        } catch (e) {
            alert('Upload gagal: ' + e.message);
        } finally {
            setUploading(null);
        }
    };

    const handleSaveOne = async (id) => {
        setSaving(id);
        try {
            const item = icons.find(i => i.id === id);
            // Read all current saved paths
            const res = await fetch('/api/settings');
            const data = await res.json();
            const current = data.transport_icons || {};
            const updated = { ...current, [id]: item.svgPath };

            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transport_icons: updated }),
            });
            setSaved(id);
            setTimeout(() => setSaved(null), 2000);
        } catch (e) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setSaving(null);
        }
    };

    const handleSaveAll = async () => {
        setSaving('all');
        try {
            const iconMap = {};
            icons.forEach(i => { if (i.svgPath) iconMap[i.id] = i.svgPath; });
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transport_icons: iconMap }),
            });
            setSaved('all');
            setTimeout(() => setSaved(null), 2000);
        } catch (e) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setSaving(null);
        }
    };

    const handleReset = async (id) => {
        if (!confirm(`Reset icon ${id} ke default?`)) return;
        setIcons(prev => prev.map(item =>
            item.id === id ? { ...item, svgPath: '' } : item
        ));
        // Save empty to API
        const res = await fetch('/api/settings');
        const data = await res.json();
        const current = data.transport_icons || {};
        delete current[id];
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transport_icons: current }),
        });
    };

    const updatePath = (id, val) => {
        setIcons(prev => prev.map(item =>
            item.id === id ? { ...item, svgPath: val } : item
        ));
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Icon Moda Transport</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola icon SVG untuk setiap moda transportasi yang tampil di halaman Akses Menuju Destinasi
                        </p>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving === 'all'}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-60"
                    >
                        {saved === 'all'
                            ? <><CheckCircle size={14} /> Tersimpan!</>
                            : <><Save size={14} /> Simpan Semua</>
                        }
                    </button>
                </div>

                {/* Preview Bar — how it looks in the route access section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview — Tampilan di App</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        {icons.map(item => (
                            <div key={item.id} className="flex flex-col items-center gap-1.5">
                                <div className="bg-gray-50 rounded-[50px] p-[5px] flex items-center justify-center" style={{ width: 40, height: 40 }}>
                                    <TransportIconPreview svgPath={item.svgPath} defaultPath={item.defaultPath} size={30} />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{item.id}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Icon Cards */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {icons.map(item => (
                            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                {/* Top: icon + meta */}
                                <div className="flex items-start gap-4 mb-4">
                                    {/* Current icon preview */}
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                            <TransportIconPreview svgPath={item.svgPath} defaultPath={item.defaultPath} size={40} />
                                        </div>
                                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {item.svgPath ? 'Custom' : 'Default'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-gray-800">{item.label}</span>
                                            <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{item.id}</code>
                                        </div>
                                        <p className="text-xs text-gray-400">{item.description}</p>
                                    </div>
                                </div>

                                {/* SVG Path input */}
                                <div className="mb-3">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Path SVG (dari MinIO)</label>
                                    <input
                                        type="text"
                                        value={item.svgPath}
                                        onChange={e => updatePath(item.id, e.target.value)}
                                        placeholder="logo/filename.svg atau kosongkan untuk default"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    />
                                </div>

                                {/* Upload + Save */}
                                <div className="flex items-center gap-2">
                                    {/* Hidden file input */}
                                    <input
                                        ref={el => fileInputRefs.current[item.id] = el}
                                        type="file"
                                        accept=".svg,image/svg+xml,.png,image/png"
                                        className="hidden"
                                        onChange={e => handleUpload(item.id, e.target.files[0])}
                                    />
                                    <button
                                        onClick={() => fileInputRefs.current[item.id]?.click()}
                                        disabled={uploading === item.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 text-xs font-medium transition-colors disabled:opacity-50 flex-1"
                                    >
                                        <Upload size={12} />
                                        {uploading === item.id ? 'Mengupload...' : 'Upload SVG / PNG'}
                                    </button>
                                    {item.svgPath && (
                                        <button
                                            onClick={() => handleReset(item.id)}
                                            title="Reset ke default"
                                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            <RefreshCw size={13} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSaveOne(item.id)}
                                        disabled={saving === item.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${saved === item.id
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            } disabled:opacity-50`}
                                    >
                                        {saved === item.id
                                            ? <><CheckCircle size={12} /> Tersimpan</>
                                            : <><Save size={12} /> Simpan</>
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
