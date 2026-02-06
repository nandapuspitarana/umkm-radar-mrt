import React, { useEffect, useState } from 'react';

export default function Footer() {
    const [settings, setSettings] = useState({
        footer_text: '© 2024 FreshMart',
        footer_links: []
    });

    useEffect(() => {
        fetch('http://localhost:3000/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.footer_text || data.footer_links) {
                    setSettings({
                        footer_text: data.footer_text || '© 2024 FreshMart',
                        footer_links: data.footer_links || []
                    });
                }
            })
            .catch(err => console.error("Failed to fetch footer settings"));
    }, []);

    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-8">
            <div className="max-w-md mx-auto px-4 text-center">
                <div className="flex justify-center gap-4 mb-4">
                    {settings.footer_links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Static Links */}
                <div className="flex justify-center gap-4 mb-4 text-xs font-semibold text-gray-400">
                    <a href="/about" className="hover:text-green-600 transition-colors">Tentang Kami</a>
                    <a href="/terms" className="hover:text-green-600 transition-colors">Syarat & Ketentuan</a>
                    <a href="/privacy" className="hover:text-green-600 transition-colors">Privasi</a>
                </div>
                <p className="text-xs text-gray-400">
                    {settings.footer_text}
                </p>
            </div>
        </footer>
    );
}
