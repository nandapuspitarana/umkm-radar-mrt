import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { getImageUrl } from '../utils/api';

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
    const fileInputRef = useRef(null);

    const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|mov)$/i) || url.includes('data:video');
    };

    const handleUpload = async (file) => {
        if (!file) return;

        // Validate file type (image or video)
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            setError('File harus berupa gambar atau video');
            return;
        }

        // Validate file size (max 50MB for video, 5MB for image)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`Ukuran file maksimal ${file.type.startsWith('video/') ? '50MB' : '5MB'}`);
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('alt', file.name);

        try {
            const res = await fetch(API_ENDPOINTS.assetsUpload, {
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
                            src={getImageUrl(value, { w: 400, resize: 'fit' })}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // If proxy fails (e.g. local blob), try direct url
                                if (e.target.src !== value) {
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
                        accept="image/*,video/mp4,video/webm"
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

            {/* Manual URL Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 p-2 border rounded-lg text-sm"
                />
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
