
const API_BASE = ''; // Relative path, handled by vite proxy

/**
 * Get image URL via backend imgproxy
 */
export function getImageUrl(path, options = {}) {
    if (!path) return '';

    // Handle legacy localhost URLs (convert to relative)
    let cleanPath = path;
    if (path.includes('localhost:9000/assets/')) {
        cleanPath = path.replace(/https?:\/\/localhost:9000\/assets\//, '');
    } else if (path.startsWith('http')) {
        return path; // Return external URLs as is
    }

    // Clean leading slash
    cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    // Default options
    const {
        resize = 'fit',
        w = 0,
        h = 0,
        gravity = 'no',
        enlarge = 0,
        ext = 'webp'
    } = options;

    // Construct query string
    const query = new URLSearchParams();
    if (resize) query.append('resize', resize);
    if (w) query.append('w', w);
    if (h) query.append('h', h);
    if (gravity) query.append('gravity', gravity);
    if (enlarge) query.append('enlarge', enlarge);
    if (ext) query.append('ext', ext);

    return `${API_BASE}/api/image/${cleanPath}?${query.toString()}`;
}

/**
 * Get raw asset URL (Video/File) via backend proxy
 */
export function getAssetUrl(path) {
    if (!path) return '';

    // Handle legacy localhost URLs (convert to relative)
    let cleanPath = path;
    if (path.includes('localhost:9000/assets/')) {
        cleanPath = path.replace(/https?:\/\/localhost:9000\/assets\//, '');
    } else if (path.startsWith('http') && !path.includes('/api/')) {
        return path; // Return external URLs as is
    }

    // Clean leading slash
    cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    return `${API_BASE}/api/raw/${cleanPath}`;
}
