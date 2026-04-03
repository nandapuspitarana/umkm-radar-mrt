
const API_BASE = ''; // Relative path, handled by vite proxy

/**
 * Resolve any stored image path → /uploads/* backend proxy.
 *
 * Handles all URL formats stored in the database:
 *   http://localhost:9000/assets/banners/a.jpg  → /uploads/banners/a.jpg
 *   /assets/banners/a.jpg                       → /uploads/banners/a.jpg
 *   /uploads/banners/a.jpg                      → /uploads/banners/a.jpg
 *   banners/a.jpg                               → /uploads/banners/a.jpg
 *   https://cdn.example.com/img.jpg             → as-is (external CDN)
 */
export function resolveImgUrl(raw) {
    if (!raw) return '';

    // Full localhost:9000 MinIO URL → extract path after bucket "assets"
    if (raw.startsWith('http') && raw.includes(':9000')) {
        const idx = raw.indexOf('/assets/');
        if (idx !== -1) return `${API_BASE}/uploads/` + raw.slice(idx + '/assets/'.length);
        return raw;
    }

    // Any other absolute external URL (CDN, etc.) → use as-is
    if (raw.startsWith('http')) return raw;

    // /assets/banners/a.jpg → /uploads/banners/a.jpg
    if (raw.startsWith('/assets/')) {
        return `${API_BASE}/uploads/` + raw.slice('/assets/'.length);
    }

    // Already a /uploads/... proxy path
    if (raw.startsWith('/uploads/')) return raw;

    // Strip leading /uploads/ if stored with prefix
    if (raw.startsWith('uploads/')) {
        return `${API_BASE}/uploads/` + raw.slice('uploads/'.length);
    }
    
    // Fallback for older database formats containing '/api/raw/' prefix
    if (raw.startsWith('/api/raw/')) {
        return `${API_BASE}/uploads/` + raw.slice('/api/raw/'.length);
    }
    
    if (raw.startsWith('api/raw/')) {
        return `${API_BASE}/uploads/` + raw.slice('api/raw/'.length);
    }

    // Bare path like  banners/a.jpg  or  /banners/a.jpg
    return `${API_BASE}/uploads/` + raw.replace(/^\//, '');
}

/**
 * Get image URL — kept for backward compatibility.
 * Previously used imgproxy (/api/image/...) which required imgproxy to be running.
 * Now routes through the simpler /uploads/* backend proxy instead.
 * The `options` parameter is accepted but ignored (no longer used for resizing here).
 */
export function getImageUrl(path, options = {}) {
    return resolveImgUrl(path);
}

/**
 * Get raw asset URL (Video/File) via backend proxy.
 */
export function getAssetUrl(path) {
    if (!path) return '';

    // Full localhost MinIO URL
    if (path.startsWith('http') && path.includes(':9000')) {
        const idx = path.indexOf('/assets/');
        if (idx !== -1) return `${API_BASE}/uploads/` + path.slice(idx + '/assets/'.length);
        return path;
    }

    // External URL
    if (path.startsWith('http')) return path;

    // /assets/... → /uploads/...
    if (path.startsWith('/assets/')) {
        return `${API_BASE}/uploads/` + path.slice('/assets/'.length);
    }

    if (path.startsWith('/uploads/')) return path;
    if (path.startsWith('uploads/')) return `${API_BASE}/uploads/` + path.slice('uploads/'.length);

    // Fallback for older database formats containing '/api/raw/' prefix
    if (path.startsWith('/api/raw/')) {
        return `${API_BASE}/uploads/` + path.slice('/api/raw/'.length);
    }
    
    if (path.startsWith('api/raw/')) {
        return `${API_BASE}/uploads/` + path.slice('api/raw/'.length);
    }

    return `${API_BASE}/uploads/` + path.replace(/^\//, '');
}
