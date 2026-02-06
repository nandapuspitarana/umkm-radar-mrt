export const vendors = [
    {
        id: 1,
        name: "FreshMart Cabang Selatan",
        location: { lat: -6.261493, lng: 106.810600 }, // Jakarta Selatan area
        whatsapp: "6281234567890",
        address: "Jl. Kemang Raya No. 10",
        rating: 4.8,
        category: "Umum"
    },
    {
        id: 2,
        name: "Berkah Sayur Mayur",
        location: { lat: -6.175110, lng: 106.865039 }, // Jakarta Timur area
        whatsapp: "6281298765432",
        address: "Jl. Rawamangun Muka No. 5",
        rating: 4.9,
        category: "Sayuran"
    },
    {
        id: 3,
        name: "Toko Buah Segar Jaya",
        location: { lat: -6.121435, lng: 106.774124 }, // Jakarta Utara area
        whatsapp: "6282112345678",
        address: "Jl. Pluit Karang No. 88",
        rating: 4.7,
        category: "Buah"
    }
];

export const products = [
    // Vendor 1 Products
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
    },
    {
        id: 103,
        vendorId: 1,
        name: "Daging Sapi Slice 500g",
        price: 65000,
        originalPrice: 75000,
        category: "Daging",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop",
        rating: 4.9
    },

    // Vendor 2 Products
    {
        id: 201,
        vendorId: 2,
        name: "Bayam Organik Ikat",
        price: 5000,
        category: "Sayuran",
        image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop",
        rating: 4.7
    },
    {
        id: 202,
        vendorId: 2,
        name: "Wortel Brastagi 1kg",
        price: 15000,
        category: "Sayuran",
        image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop",
        rating: 4.8
    },

    // Vendor 3 Products
    {
        id: 301,
        vendorId: 3,
        name: "Jeruk Medan Manis 1kg",
        price: 25000,
        category: "Buah",
        image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=400&fit=crop",
        rating: 4.6
    },
    {
        id: 302,
        vendorId: 3,
        name: "Anggur Merah 500g",
        price: 35000,
        originalPrice: 45000,
        category: "Buah",
        image: "https://images.unsplash.com/photo-1537162998323-3d3675e0e87c?w=400&h=400&fit=crop",
        rating: 4.8
    }
];
