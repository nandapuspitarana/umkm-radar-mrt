// API Fetch Helper
// Automatically prepends API_URL to all API requests

import { API_URL } from '../config/api';

/**
 * Enhanced fetch that automatically uses the correct API URL
 * @param {string} endpoint - API endpoint (e.g., '/api/vendors' or 'api/vendors')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Build full URL
    const url = `${API_URL}${normalizedEndpoint}`;

    // Add default headers
    const defaultHeaders = {
        // Add any default headers here
    };

    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    // Make the request
    return fetch(url, mergedOptions);
}

/**
 * API fetch with automatic JSON parsing
 * @param {string} endpoint - API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiJson(endpoint, options = {}) {
    const response = await apiFetch(endpoint, options);

    if (!response.ok) {
        const error = new Error(`API Error: ${response.status} ${response.statusText}`);
        error.response = response;
        throw error;
    }

    return response.json();
}

/**
 * Upload file to API
 * @param {string} endpoint - Upload endpoint
 * @param {FormData} formData - Form data with file
 * @returns {Promise<any>} Upload response
 */
export async function apiUpload(endpoint, formData) {
    return apiFetch(endpoint, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let browser set it with boundary
    });
}

/**
 * Get processed image URL via backend proxy (Imgproxy)
 * @param {string} path - Image path (e.g., 'banners/image.jpg')
 * @param {object} options - Processing options (w, h, resize, etc)
 * @returns {string} Processed URL
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

    return `${API_URL}/api/image/${cleanPath}?${query.toString()}`;
}

/**
 * Get raw asset URL (Video/File) via backend proxy
 * Handles legacy localhost URLs automatically
 * @param {string} path - Asset path or URL
 * @returns {string} Safe accessible URL
 */
export function getAssetUrl(path) {
    if (!path) return '';

    // Handle legacy localhost URLs (convert to relative)
    let cleanPath = path;
    if (path.includes('localhost:9000/assets/')) {
        cleanPath = path.replace(/https?:\/\/localhost:9000\/assets\//, '');
    } else if (path.startsWith('http') && !path.includes(API_URL)) {
        return path; // Return external URLs as is (unless it's our API)
    }

    // Clean leading slash
    cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    return `${API_URL}/api/raw/${cleanPath}`;
}

export default apiFetch;
