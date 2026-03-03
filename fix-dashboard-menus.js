const fs = require('fs');

function patchFile(filePath, btnLabel) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Make sure we have XLSX and showMenu state
    if (!code.includes("import * as XLSX from 'xlsx';")) {
        code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport * as XLSX from 'xlsx';");
    }

    if (!code.includes("showMenu")) {
        code = code.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);\n    const [showMenu, setShowMenu] = useState(false);");
    }

    const isDest = btnLabel === 'Destinasi';
    const entity = isDest ? 'destinations' : 'vendors';
    const refArray = isDest ? 'destinations' : 'vendors';
    const fetchFunc = isDest ? 'fetchDestinations();' : 'fetchVendors();';
    
    // Check if functions are missing
    if (!code.includes('const exportExcel = () => {')) {
        const funcs = `
    const exportExcel = () => {
        const data = ${refArray}.map(v => ({
            name: v.name || "",
            description: v.description || "",
            category: v.category || "",
            subcategory: v.subcategory || "",
            address: v.address || "",
            lat: v.lat || "",
            lng: v.lng || "",
            image: v.image || "",
            ${isDest ? 'ticketPrice: v.ticketPrice || "",\n' : 'whatsapp: v.whatsapp || "",\n            rating: v.rating || 0,\n'}            nearestStation: v.nearestStation || "",
            stationType: v.stationType || "MRT",
            distanceFromStation: v.distanceFromStation || 0,
            walkingTimeMinutes: v.walkingTimeMinutes || 0
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, "${entity}.xlsx");
    };

    const downloadTemplate = () => {
        const template = [{
            name: "Contoh", description: "Deskripsi", category: "${isDest ? 'Publik' : 'kuliner'}", subcategory: "${isDest ? 'Mall & Plaza Terbuka' : 'Makanan'}",
            address: "Alamat lengkap", lat: -6.2, lng: 106.8, image: "https://link-gambar.com",
            ${isDest ? 'ticketPrice: "Gratis",\n' : 'whatsapp: "6281234567890", rating: 4.5,\n'}            nearestStation: "Stasiun MRT Blok M", stationType: "MRT",
            distanceFromStation: 100, walkingTimeMinutes: 2
        }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "template_${entity}.xlsx");
    };

    const importExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                const res = await fetch("/api/${entity}/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Actor-Name": localStorage.getItem("username") || "Admin" },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    alert("Import berhasil");
                    ${fetchFunc}
                } else {
                    const err = await res.json();
                    alert("Error: " + err.error);
                }
            } catch (err) {
                alert("Gagal import. Pastikan format file sesuai template.");
            }
            e.target.value = "";
        };
        reader.readAsBinaryString(file);
    };

    const filtered`;
        code = code.replace("const filtered", funcs);
    }

    // Now let's replace the header button!
    // We search for `<button` that contains `Tambah Mitra` or `Tambah Destinasi` up to `</button>`
    const headerRegex = isDest ? 
        /<button onClick=\{handleAdd\} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600\/20">[\s\S]*?Tambah Destinasi\s*<\/button>/g :
        /<button\s+data-testid="add-vendor-btn"\s+onClick=\{handleAdd\}\s+className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600\/20">[\s\S]*?Tambah Mitra\s*<\/button>/g;

    const newHeader = `<div className="flex items-center gap-3 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 shadow-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
                            >
                                <span>Menu Aksi</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={\`w-4 h-4 transition-transform \${showMenu ? 'rotate-180' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100]">
                                    <button 
                                        onClick={() => { setShowMenu(false); downloadTemplate(); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-b border-gray-50 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Format (Template)
                                    </button>
                                    <label className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 border-b border-gray-50 flex items-center gap-2 cursor-pointer mb-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        Import Excel (Bulk)
                                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => { setShowMenu(false); importExcel(e); }} />
                                    </label>
                                    <button 
                                        onClick={() => { setShowMenu(false); exportExcel(); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Export Excel
                               
