export const vendors = [
    {
        id: 1,
        name: "UMKM Radar Selatan",
        location: { lat: -6.261493, lng: 106.810600 },
        whatsapp: "6281234567890",
        address: "Jl. Kemang Raya No. 10",
        rating: 4.8
    },
    {
        id: 2,
        name: "Berkah Sayur Mayur",
        location: { lat: -6.175110, lng: 106.865039 },
        whatsapp: "6281298765432",
        address: "Jl. Rawamangun Muka No. 5",
        rating: 4.9
    }
];

export const products = [
    {
        id: 101,
        vendorId: 1,
        name: "Apel Fuji Premium Import",
        price: 45000,
        originalPrice: 60000,
        category: "Buah",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop",
        rating: 4.8
    },
    {
        id: 102,
        vendorId: 1,
        name: "Brokoli Hijau Segar",
        price: 25500,
        originalPrice: 30000,
        category: "Sayuran",
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop",
        rating: 4.9
    }
];

// Mock Orders
export const initialOrders = [
    {
        id: 1706428231234,
        vendorId: 1,
        customer: "Budi Santoso",
        total: 70500,
        status: "pending",
        items: [
            { name: "Apel Fuji Premium Import", qty: 1, price: 45000 },
            { name: "Brokoli Hijau Segar", qty: 1, price: 25500 }
        ],
        date: "2026-01-28T10:00:00Z"
    },
    {
        id: 1706429999999,
        vendorId: 1,
        customer: "Siti Aminah",
        total: 45000,
        status: "confirmed",
        items: [
            { name: "Apel Fuji Premium Import", qty: 1, price: 45000 }
        ],
        date: "2026-01-28T11:30:00Z"
    }
];
