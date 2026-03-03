const fs = require('fs');

function patchAdminVendors() {
    let code = fs.readFileSync('dashboard/src/pages/AdminVendors.jsx', 'utf8');

    // Add import
    if (!code.includes("import * as XLSX from 'xlsx';")) {
        code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport * as XLSX from 'xlsx';");
    }

    // Add functions inside component (before return statement)
    const exportFunctions = `
    const exportExcel = () => {
        const data = vendors.map(v => ({
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
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Merchants");
        XLSX.writeFile(wb, "merchants.xlsx");
    };

    const downloadTemplate = () => {
        const template = [{
            name: 'Contoh Toko', description: 'Deskripsi toko', category: 'kuliner', subcategory: 'Makanan',
            address: 'Alamat lengkap', lat: -6.2, lng: 106.8, image: 'https://link-gambar.com',
            whatsapp: '6281234567890', rating: 4.5, nearestStation: 'Stasiun MRT Blok M', stationType: 'MRT',
            distanceFromStation: 100, walkingTimeMinutes: 2
        }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "merchant_template.xlsx");
    };

    const importExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                const res = await fetch('/api/vendors/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Actor-Name': localStorage.getItem('username') || 'Admin' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    alert('Import berhasil');
                    fetchVendors();
                } else {
                    const err = await res.json();
                    alert('Error: ' + err.error);
                }
            } catch (err) {
                alert('Gagal import. Pastikan format file sesuai template.');
            }
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const filteredVendors = vendors`;

    if (!code.includes("const exportExcel = () => {")) {
        code = code.replace("const filteredVendors = vendors", exportFunctions);
    }

    // Add buttons
    const buttonsTarget = `<button
                        data-testid="add-vendor-btn"
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                    >
                        <Plus size={18} />
                        Tambah Mitra
                    </button>`;
    
    const buttonsReplacement = `<div className="flex gap-2 items-center">
                        <button
                            onClick={exportExcel}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all font-bold text-sm"
                        >
                            Export Excel
                        </button>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 shadow-lg shadow-gray-600/20 transition-all font-bold text-sm"
                        >
                            Format (Template)
                        </button>
                        <label className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all font-bold text-sm cursor-pointer mb-0">
                            Import Bulk (Excel)
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importExcel} />
                        </label>
                        <button
                            data-testid="add-vendor-btn"
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                        >
                            <Plus size={18} />
                            Tambah Mitra
                        </button>
                    </div>`;

    if (code.includes(buttonsTarget) && !code.includes("Export Excel")) {
        code = code.replace(buttonsTarget, buttonsReplacement);
    }

    fs.writeFileSync('dashboard/src/pages/AdminVendors.jsx', code);
}

function patchDestinations() {
    let code = fs.readFileSync('dashboard/src/pages/Destinations.jsx', 'utf8');

    if (!code.includes("import * as XLSX from 'xlsx';")) {
        code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport * as XLSX from 'xlsx';");
    }

    const exportFunctions = `
    const exportExcel = () => {
        const data = destinations.map(d => ({
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
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Destinations");
        XLSX.writeFile(wb, "destinations.xlsx");
    };

    const downloadTemplate = () => {
        const template = [{
            name: 'Contoh Destinasi', description: 'Deskripsi destinasi', category: 'Publik', subcategory: 'Mall & Plaza Terbuka',
            address: 'Alamat lengkap', lat: -6.2, lng: 106.8, image: 'https://link-gambar.com',
            nearestStation: 'Stasiun MRT Blok M', stationType: 'MRT',
            distanceFromStation: 100, walkingTimeMinutes: 2, ticketPrice: 'Gratis'
        }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "destinations_template.xlsx");
    };

    const importExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
              
