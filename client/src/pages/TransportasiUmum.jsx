import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { getAssetUrl } from '../utils/api';

const transportData = [
    {
        id: 1,
        name: 'TransJakarta',
        logoType: 'TiJe',
        halte: 'Terminal Blok M',
        jarak: '150 m dari posisi kamu',
        koridor: [
            'Koridor 1 Blok M - Kota',
            'Feeder 1F → Stasiun Palmerah',
            'Feeder 4C → Pulo Gadung',
            'Feeder 6M → St. Manggarai - Blok M',
            'Feeder 9C → Pinang Ranti - Bdr. Senayan',
            'Feeder 10H → Tanjung Priok',
        ],
    },
    {
        id: 2,
        name: 'JakLingko (Mikrotrans)',
        logoType: 'JakLingko',
        halte: 'Halte Blok M Plaza',
        jarak: '230 m dari posisi kamu',
        koridor: [
            'JAK 31: Blok M → Andara',
            'JAK 102: Blok M → Lebak Bulus',
            'JAK 54: Blok M → Cipete',
            'JAK 57: Blok M → Pondok Labu',
        ],
    },
];

const TRANSPORT_DEFAULTS = {
    MRT: '/assets/transport/mrt-logo.svg',
    TiJe: '/assets/transport/tije-logo.svg',
    JakLingko: '/assets/transport/jaklingko-logo.svg',
    KAI: '/assets/transport/kai-commuter-logo.svg',
    LRT: '/assets/transport/lrt-logo.svg',
    Whoosh: '/assets/transport/whoosh-logo.svg',
};

function TransportLogo({ logoType, transportIcons }) {
    const customPath = transportIcons?.[logoType];
    const src = customPath ? getAssetUrl(customPath) : TRANSPORT_DEFAULTS[logoType];

    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <div className="w-[50px] h-[50px] bg-white rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={logoType}
                    className="w-[40px] h-[40px] object-contain rounded-full"
                    onError={() => {
                        // Fallback to default if custom fail
                        if (customPath && imgSrc !== TRANSPORT_DEFAULTS[logoType]) {
                            setImgSrc(TRANSPORT_DEFAULTS[logoType]);
                        }
                    }}
                />
            ) : (
                <span className="text-gray-400 text-xs">{logoType}</span>
            )}
        </div>
    );
}



function RouteItem({ label }) {
    return (
        <div className="flex gap-[5px] items-center">
            <div className="bg-white flex items-center justify-center rounded-full shrink-0 w-[36px] h-[36px] border border-grey-200">
                <Check size={14} className="text-grey-600" />
            </div>
            <p className="capitalize font-semibold text-[15px] text-grey-700 tracking-[-0.45px] leading-tight">
                {label}
            </p>
        </div>
    );
}

function TransportCard({ item, transportIcons }) {
    return (
        <div className="bg-white rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.20)] pb-[15px] pt-[5px] px-[5px] flex flex-col gap-[10px]">
            {/* Header: logo + nama + halte + jarak */}
            <div className="bg-grey-100 rounded-[15px] p-[5px] flex gap-[5px] items-start">
                <div className="flex items-center justify-center shrink-0">
                    <TransportLogo logoType={item.logoType} transportIcons={transportIcons} />
                </div>
                <div className="flex flex-col gap-[4px] py-[5px] flex-1 min-w-0">
                    <p className="capitalize font-bold text-[18px] text-black leading-tight">{item.name}</p>
                    <p className="capitalize font-semibold text-[15px] text-black leading-tight">{item.halte}</p>
                    <p className="font-medium text-[13px] text-grey-600 leading-tight">{item.jarak}</p>
                </div>
            </div>

            {/* Route list */}
            <div className="flex flex-col px-[5px] gap-[4px]">
                {item.koridor.map((k, idx) => (
                    <RouteItem key={idx} label={k} />
                ))}
            </div>
        </div>
    );
}

export default function TransportasiUmum() {
    const navigate = useNavigate();
    const [transportIcons, setTransportIcons] = useState({});

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.transport_icons) {
                    setTransportIcons(data.transport_icons);
                }
            })
            .catch(err => console.error('Failed to fetch transport icons:', err));
    }, []);

    return (
        <div className="min-h-screen bg-grey-100 flex flex-col">
            {/* Header — mirip Figma: headbar dengan back + title + station */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-grey-200">
                <div className="flex items-center justify-between px-4 h-[64px] gap-[10px]">
                    {/* Back button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-grey-100 transition-colors shrink-0"
                        aria-label="Kembali"
                    >
                        <ChevronLeft size={24} className="text-grey-700" />
                    </button>

                    {/* Title center */}
                    <div className="flex flex-col items-center flex-1 text-center overflow-hidden">
                        <h1 className="font-display text-[15px] uppercase tracking-[0.225px] text-[#242424] leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                            Moda Integrasi Terdekat
                        </h1>
                        <p className="font-semibold text-[13px] text-highlight-blue tracking-[-0.05px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                            Blok M
                        </p>
                    </div>

                    {/* Spacer kanan (simetris dengan back button) */}
                    <div className="w-[36px] shrink-0" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-[10px] flex flex-col gap-[10px] pb-8">
                {transportData.map((item) => (
                    <TransportCard key={item.id} item={item} transportIcons={transportIcons} />
                ))}
            </main>
        </div>
    );
}
