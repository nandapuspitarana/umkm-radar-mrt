import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

/**
 * ImageUploader - Reusable component for uploading images to MinIO
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback when image URL changes
 * @param {string} category - Asset category (product, logo, banner)
 * @param {string} placeholder - Placeholder text
 */
export default function ImageUploader({
    value = '',
    onChange,
    category = 'product',
    placeholder = 'Upload gambar atau masukkan URL'
}) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Ukuran file maksimal 5MB');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('alt', file.name);

        try {
            const res = await fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            // Use direct MinIO URL for the image
            onChange(data.directUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Gagal upload gambar. Coba lagi.');
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
                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden group">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Upload Area */}
            {!value && (
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
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
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        <p className="text-sm text-gray-500">
                            {uploading ? 'Mengupload...' : 'Klik atau drag gambar di sini'}
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG hingga 5MB</p>
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
                {value && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
