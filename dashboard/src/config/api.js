// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_URL = API_BASE_URL;
export const API_ENDPOINTS = {
    // Auth
    login: `${API_BASE_URL}/api/login`,

    // Assets
    assetsUpload: `${API_BASE_URL}/api/assets/upload`,
    assetsList: `${API_BASE_URL}/api/assets`,
    assetsDelete: (id) => `${API_BASE_URL}/api/assets/${id}`,

    // Vendors
    vendors: `${API_BASE_URL}/api/vendors`,
    vendorById: (id) => `${API_BASE_URL}/api/vendors/${id}`,

    // Products
    products: `${API_BASE_URL}/api/products`,
    productById: (id) => `${API_BASE_URL}/api/products/${id}`,

    // Orders
    orders: `${API_BASE_URL}/api/orders`,
    orderById: (id) => `${API_BASE_URL}/api/orders/${id}`,
    orderStatus: (id) => `${API_BASE_URL}/api/orders/${id}/status`,

    // Categories
    categories: `${API_BASE_URL}/api/categories`,
    categoryById: (id) => `${API_BASE_URL}/api/categories/${id}`,

    // Destinations
    destinations: `${API_BASE_URL}/api/destinations`,
    destinationById: (id) => `${API_BASE_URL}/api/destinations/${id}`,

    // Settings
    settings: `${API_BASE_URL}/api/settings`,
    settingByKey: (key) => `${API_BASE_URL}/api/settings/${key}`,

    // Navigation
    navigation: `${API_BASE_URL}/api/navigation`,
    navigationById: (id) => `${API_BASE_URL}/api/navigation/${id}`,
};

export default API_URL;
