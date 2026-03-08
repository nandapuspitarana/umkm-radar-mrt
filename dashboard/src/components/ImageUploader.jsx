import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video, FolderOpen } from 'lucide-react';
import { getImageUrl } from '../utils/api';
import AssetPickerModal from './AssetPickerModal';

/**
 * ImageUploader - Reusable component for uploading images/videos to MinIO
 * @param {string} value - Current asset URL
 * @param {function} onChange - Callback when asset URL changes
 * @param {string} category - Asset category (product, logo, banner)
 * @param {string} placeholder - Placeholder text
 */
export default function ImageUploader({
    value = '',
    onChange,
    category = 'product',
    placeholder = 'Upload gambar/video atau masukkan URL'
}) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [compressInfo, setCompressInfo] = useState(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const fileInputRef = useRef(null);

    const IMAGE_MAX_MB = 2;
    const VIDEO_MAX_MB = 50;
    const IMAGE_MAX = IMAGE_MAX_MB * 1024 * 1024;
    const VIDEO_MAX = VIDEO_MAX_MB * 1024 * 1024;

    const fmtMB = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';

    // Kompres gambar via Canvas API — iteratif turunkan quality sampai <IMAGE_MAX
    const compressImage = (file) => new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            // Batasi dimensi maks 2400px (cukup untuk web)
            const MAX_DIM = 2400;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Turunkan quality secara iteratif sampai < IMAGE_MAX
            let quality = 0.85;
            const tryCompress = () => {
                canvas.toBlob(blob => {
                    if (!blob) { reject(new Error('Compression failed')); return; }
                    if (blob.size <= IMAGE_MAX || quality <= 0.3) {
                        // Buat File dari blob
                        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                        resolve(compressed);
                    } else {
                        quality -= 0.1;
                        tryCompress();
                    }
                }, 'image/jpeg', quality);
            };
            tryCompress();
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
        img.src = url;
    });

    const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|mov)$/i) || url.includes('data:video');
    };

    // Whitelist MIME types yang diizinkan
    const ALLOWED_MIME = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/svg+xml', 'image/avif',
        'video/mp4', 'video/webm', 'video/quicktime',
    ];

    // Ekstensi URL yang diblokir (dokumen/file non-media)
    const BLOCKED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|exe|apk|dmg|iso|xml|json)$/i;

    const handleUrlChange = (rawUrl) => {
        if (rawUrl && BLOCKED_EXTENSIONS.test(rawUrl.split('?')[0])) {
            setError('URL tidak valid: hanya gambar atau video yang diizinkan (bukan PDF/dokumen).');
            // Tetap update value agar user bisa edit, tapi kasih sinyal error
            onChange(rawUrl);
            return;
        }
        setError(null);
        onChange(rawUrl);
    };

    const handleUpload = async (file) => {
        if (!file) return;

        // Validate file type — whitelist MIME types eksplisit
        if (!ALLOWED_MIME.includes(file.type)) {
            const ext = file.name.split('.').pop()?.toUpperCase() || 'file';
            setError(`File .${ext} tidak didukung. Hanya gambar (JPG, PNG, GIF, WebP) atau video (MP4, WebM) yang diizinkan.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validate file size
        if (file.type.startsWith('video/')) {
            if (file.size > VIDEO_MAX) {
                setError(`Video terlalu besar. Maksimal ${VIDEO_MAX_MB}MB.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        } else if (file.type.startsWith('image/')) {
            // Kompres otomatis jika >2MB
            if (file.size > IMAGE_MAX) {
                const originalSize = file.size;
                setUploading(true);
                setError(null);
                setCompressInfo(null);
                try {
                    file = await compressImage(file);
                    setCompressInfo(`Dikompres: ${fmtMB(originalSize)} → ${fmtMB(file.size)}`);
                } catch (err) {
                    setError(`Gambar terlalu besar (maks ${IMAGE_MAX_MB}MB) dan gagal dikompres. Coba resize manual.`);
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
                setUploading(false);
            }
        }

        setUploading(true);
        setError(null);
        // Tidak reset compressInfo di sini agar info kompresi tetap tampil

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('alt', file.name);

        try {
            // Use relative URL to leverage Vite proxy
            const res = await fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            // Use direct MinIO URL for the asset
            onChange(data.directUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Gagal upload file. Coba lagi.');
        } finally {
            setUploading(false);
        }
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        onChange('');
        setError(null);
    };

    /**
     * Resolve any stored image path to a usable preview URL.
     * Maps every URL variant → /uploads/... backend proxy.
     *
     * Examples:
     *   http://localhost:9000/assets/banners/a.jpg  → /uploads/banners/a.jpg
     *   /assets/banners/a.jpg                       → /uploads/banners/a.jpg
     *   /uploads/banners/a.jpg                      → /uploads/banners/a.jpg
     *   banners/a.jpg                               → /uploads/banners/a.jpg
     *   https://cdn.example.com/img.jpg             → (returned as-is)
     */
    const resolvePreviewUrl = (raw) => {
        if (!raw) return '';

        // Full MinIO / localhost URL: extract path after the bucket name "assets"
        if (raw.startsWith('http') && raw.includes(':9000')) {
            // e.g. http://localhost:9000/assets/banners/a.jpg → banners/a.jpg
            const idx = raw.indexOf('/assets/');
            if (idx !== -1) {
                const storagePath = raw.slice(idx + '/assets/'.length);
                return `/uploads/${storagePath}`;
            }
            return raw; // unknown format, return as-is
        }

        // Any other absolute external URL → use as-is
        if (raw.startsWith('http')) return raw;

        // /assets/banners/a.jpg → /uploads/banners/a.jpg
        if (raw.startsWith('/assets/')) {
            return '/uploads/' + raw.slice('/assets/'.length);
        }

        // Already a /uploads/... proxy path
        if (raw.startsWith('/uploads/')) return raw;

        // Bare path: banners/a.jpg or /banners/a.jpg → /uploads/banners/a.jpg
        return '/uploads/' + raw.replace(/^\//, '');
    };

    return (
        <div className="space-y-2">
            {/* Preview */}
            {value && (
                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden group border border-gray-200">
                    {isVideo(value) ? (
                        <video
                            src={value}
                            className="w-full h-full object-cover"
                            controls
                            muted
                        />
                    ) : (
                        <img
                            src={resolvePreviewUrl(value)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback chain: proxy → direct value → hide
                                if (e.target.src === resolvePreviewUrl(value) && e.target.src !== value) {
                                    e.target.src = value;
                                } else {
                                    e.target.style.display = 'none';
                                }
                            }}
                        />
                    )}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <X size={14} />
                    </button>
                    {/* File Type Indicator */}
                    <div className="absolute bottom-2 right-2 p-1 bg-black/50 text-white rounded text-xs opacity-70">
                        {isVideo(value) ? <Video size={12} /> : <ImageIcon size={12} />}
                    </div>
                </div>
            )}

            {/* Upload Area */}
            {!value && (
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        <p className="text-sm text-gray-500">
                            {uploading ? 'Mengupload...' : 'Klik atau drag file di sini'}
                        </p>
                        <p className="text-xs text-gray-400">Gambar (5MB) atau Video (50MB)</p>
                    </div>
                </div>
            )}

            {/* Pick from Asset Manager button */}
            <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
                <FolderOpen size={15} />
                Pilih dari Asset Manager
            </button>

            {/* Manual URL Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={placeholder}
                    className={`flex-1 p-2 border rounded-lg text-sm transition ${error && value ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        }`}
                />
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>
            )}
            {/* Compress Info */}
            {compressInfo && !error && (
                <p className="text-xs text-green-600 flex items-center gap-1"><span>✓</span>{compressInfo}</p>
            )}

            {/* Asset Picker Modal */}
            <AssetPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(url) => { onChange(url); setError(null); }}
                filterType={category === 'product' || category === 'logo' || category === 'banner' ? 'image' : ''}
            />
        </div>
    );
}
