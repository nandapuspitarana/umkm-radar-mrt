import React, { useState, useEffect } from 'react';

export default function TransportLinks() {
    const [transportModa, setTransportModa] = useState([]); // Fetched from database
    const [loading, setLoading] = useState(true);

    // Fetch transport links from settings API (stored in database)
    useEffect(() => {
        setLoading(true);
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.transport_links && data.transport_links.length > 0) {
                    setTransportModa(data.transport_links);
                }
            })
            .catch(err => console.error("Failed to load transport links", err))
            .finally(() => setLoading(false));
    }, []);

    // Figma layout: First row = 3 items (80px height), Second row = 2 items (60px height)
    const topRow = transportModa.slice(0, 3);
    const bottomRow = transportModa.slice(3, 5);

    // Loading skeleton
    if (loading) {
        return (
            <div className="flex flex-col gap-[10px] w-full px-2.5">
                <div className="px-2.5 pt-2.5">
                    <div className="h-4 w-32 bg-grey-200 rounded animate-pulse" />
                </div>
                <div className="flex flex-col gap-[5px] max-w-[500px]">
                    <div className="flex gap-[5px]">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-1 h-[80px] bg-grey-200 rounded-[15px] animate-pulse" />
                        ))}
                    </div>
                    <div className="flex gap-[5px]">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex-1 h-[60px] bg-grey-200 rounded-[15px] animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Empty state - no transport links in database
    if (transportModa.length === 0) {
        return (
            <div className="flex flex-col gap-[10px] w-full px-2.5">
                <div className="px-2.5 pt-2.5">
                    <h3 className="font-bold text-[15px] capitalize text-black">
                        lanjutkan perjalanan
                    </h3>
                </div>
                <div className="bg-grey-200 rounded-[15px] p-6 text-center text-grey-400">
                    <p className="text-sm">Belum ada transport links.</p>
                    <p className="text-xs">Kelola di Admin Dashboard → Settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[10px] w-full px-2.5">
            {/* Section Header */}
            <div className="px-2.5 pt-2.5">
                <h3 className="font-bold text-[15px] capitalize text-black">
                    lanjutkan perjalanan
                </h3>
            </div>

            {/* Transport Links Container */}
            <div className="flex flex-col gap-[5px] max-w-[500px]">
                {/* Top row - 3 items, h-[80px] */}
                {topRow.length > 0 && (
                    <div className="flex gap-[5px]">
                        {topRow.map((moda) => (
                            <a
                                key={moda.id}
                                href={moda.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-[80px] bg-white rounded-[15px] flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <img
                                    src={moda.logo}
                                    alt={moda.name}
                                    className="max-h-[50px] max-w-[70%] object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<span class="text-xs font-semibold text-grey-600">${moda.name}</span>`;
                                    }}
                                />
                            </a>
                        ))}
                    </div>
                )}

                {/* Bottom row - 2 items, h-[60px] */}
                {bottomRow.length > 0 && (
                    <div className="flex gap-[5px]">
                        {bottomRow.map((moda) => (
                            <a
                                key={moda.id}
                                href={moda.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-[60px] bg-white rounded-[15px] flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <img
                                    src={moda.logo}
                                    alt={moda.name}
                                    className="max-h-[40px] max-w-[70%] object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<span class="text-xs font-semibold text-grey-600">${moda.name}</span>`;
                                    }}
                                />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
