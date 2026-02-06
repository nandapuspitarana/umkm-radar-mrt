import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StaticPage({ title, pageKey }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/api/settings')
            .then(res => res.json())
            .then(data => {
                setContent(data[pageKey] || 'Belum ada konten.');
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                if (err.message) setContent('Error loading content.');
                setLoading(false);
            });
    }, [pageKey]);

    return (
        <div className="min-h-screen bg-bg">
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-bold">Kembali</span>
                    </a>
                    <span className="font-serif font-bold text-xl text-primary">FreshMart</span>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                ) : (
                    <div className="prose prose-green max-w-none bg-white p-6 rounded-2xl shadow-sm border border-gray-100 whitespace-pre-wrap">
                        {content}
                    </div>
                )}
            </main>
        </div>
    );
}
