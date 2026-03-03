const fs = require('fs');
const Papa = require('papaparse'); // to ensure we don't mess up

let adminVendors = fs.readFileSync('dashboard/src/pages/AdminVendors.jsx', 'utf8');

if(!adminVendors.includes('papaparse')) {
    adminVendors = "import Papa from 'papaparse';\n" + adminVendors;
}

const importExportButtons = `
                            <div className="flex gap-2">
                                <button
                                    onClick={exportCSV}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                                >
                                    Export CSV
                                </button>
                                <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 cursor-pointer">
                                    Import CSV
                                    <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
                                </label>
                                <button
                                    onClick={downloadTemplate}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                                >
                                    Format
                                </button>
                                <button
                                    onClick={() => {
`;

adminVendors = adminVendors.replace(/<button\s+onClick=\{\(\) => \{[\s\n]*resetForm\(\);[\s\n]*setIsEditing\(false\);/, importExportButtons);

const importExportFunctions = `
    const exportCSV = () => {
        const csv = Papa.unparse(vendors.map(v => ({
            name: v.name || '',
            description: v.description || '',
            category: v.category || '',
            subcategory: v.subcategory || '',
            address: v.address || '',
            lat: v.lat || '',
            lng: v.lng || '',
            image: v.image || '',
            whatsapp: v.whatsapp || '',
            rating: v.rating || 0,
            nearestStation: v.nearestStation || '',
            stationType: v.stationType || 'MRT',
            distanceFromStation: v.distanceFromStation || 0,
            walkingTimeMinutes: v.walkingTimeMinutes || 0
        })));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merchants.csv';
        a.click();
    };

    const downloadTemplate = () => {
        const template = [{
            name: 'Contoh Toko', description: 'Deskripsi toko', category: 'kuliner', subcategory: 'Makanan',
            address: 'Alamat lengkap', lat: -6.2, lng: 106.8, image: 'https://link-gambar.com',
            whatsapp: '6281234567890', rating: 4.5, nearestStation: 'Stasiun MRT Blok M', stationType: 'MRT',
            distanceFromStation: 100, walkingTimeMinutes: 2
        }];
        const csv = Papa.unparse(template);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merchant_template.csv';
        a.click();
    };

    const importCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const res = await fetch('/api/vendors/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Actor-Name': localStorage.getItem('username') || 'Admin' },
                        body: JSON.stringify(results.data)
                    });
                    if (res.ok) {
                        alert('Import berhasil');
                        fetchVendors();
                    } else {
                        const err = await res.json();
                        alert('Error: ' + err.error);
                    }
                } catch (err) {
                    alert('Gagal import');
                }
                e.target.value = '';
            }
        });
    };

    const filteredVendors = vendors`;

adminVendors = adminVendors.replace(/const filteredVendors = vendors/, importExportFunctions);

fs.writeFileSync('dashboard/src/pages/AdminVendors.jsx', adminVendors);


let destinations = fs.readFileSync('dashboard/src/pages/Destinations.jsx', 'utf8');

if(!destinations.includes('papaparse')) {
    destinations = "import Papa from 'papaparse';\n" + destinations;
}

const destButtons = `
                        <div className="flex gap-2">
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                            >
                                Export CSV
                            </button>
                            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 cursor-pointer">
                                Import CSV
                                <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
                            </label>
                            <button
                                onClick={downloadTemplate}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                            >
                                Format
                            </button>
                            <button
                                onClick={() => {
`;

destinations = destinations.replace(/<button\s+onClick=\{\(\) => \{[\s\n]*resetForm\(\);[\s\n]*setIsEditing\(false\);/, destButtons);

const destFunctions = `
    const exportCSV = () => {
        const csv = Papa.unparse(destinations.map(d => ({
            name: d.name || '',
            description: d.description || '',
            category: d.category || '',
            subcategory: d.subcategory || '',
            address: d.address || '',
            lat: d.lat || '',
            lng: d.lng || '',
            image: d.image || '',
            nearestStation: d.nearestStation || '',
            stationType: d.stationType || 'MRT',
            distanceFromStation: d.distanceFromStation || 0,
            walkingTimeMinutes: d.walkingTimeMinutes || 0,
            ticketPrice: d.ticketPrice || ''
        })));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'destinations.csv';
        a.click();
    };

    const downloadTemplate = () => {
        const template = [{
            name: 'Contoh Destinasi', description: 'Deskripsi destinasi', category: 'Publik', subcategory: 'Mall & Plaza Terbuka',
            address: 'Alamat lengkap', lat: -6.2, lng: 106.8, image: 'https://link-gambar.com',
            nearestStation: 'Stasiun MRT Blok M', stationType: 'MRT',
            distanceFromStation: 100, walkingTimeMinutes: 2, ticketPrice: 'Gratis'
        }];
        const csv = Papa.unparse(template);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'destinations_template.csv';
        a.click();
    };

    const importCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
