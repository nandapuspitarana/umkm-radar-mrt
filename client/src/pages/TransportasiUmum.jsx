import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';

// Transport mode data
const transportData = [
    {
        id: 1,
        name: 'TransJakarta',
        logoType: 'tije',
        halte: 'Halte Bundaran Senayan',
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
        logoType: 'jaklingko',
        halte: 'Bus Stop Bundaran Senayan',
        jarak: '230 m dari posisi kamu',
        koridor: [
            'JAK 31: Blok M → Andara',
            'JAK 102: Blok M → Lebak Bulus',
        ],
    },
];

function TijeLogo() {
    return (
        <div className="w-[30px] h-[30px] rounded-full overflow-hidden shrink-0">
            <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="15" cy="15" r="15" fill="#0033A0" />
                <path d="M7 15.5C7 15.5 9 11 15 11C21 11 23 15.5 23 15.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M10 17.5C10 17.5 11.5 14.5 15 14.5C18.5 14.5 20 17.5 20 17.5" stroke="#E4002B" strokeWidth="2" strokeLinecap="round" />
                <circle cx="15" cy="19" r="1.5" fill="white" />
            </svg>
        </div>
    );
}

function JakLingkoLogo() {
    return (
        <div className="w-[30px] h-[30px] rounded overflow-hidden shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="60" height="60" rx="8" fill="#E4002B" />
                <text x="5" y="28" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">Jak</text>
                <text x="5" y="48" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial, sans-serif">Lingko</text>
            </svg>
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

function TransportCard({ item }) {
    return (
        <div className="bg-white rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.20)] pb-[15px] pt-[5px] px-[5px] flex flex-col gap-[10px]">
            {/* Header: logo + nama + halte + jarak */}
            <div className="bg-grey-100 rounded-[15px] p-[5px] flex gap-[5px] items-start">
                <div className="bg-white rounded-full h-[50px] w-[50px] flex items-center justify-center shrink-0">
                    {item.logoType === 'tije' ? <TijeLogo /> : <JakLingkoLogo />}
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
                            Senayan Mastercard
                        </p>
                    </div>

                    {/* Spacer kanan (simetris dengan back button) */}
                    <div className="w-[36px] shrink-0" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-[10px] flex flex-col gap-[10px] pb-8">
                {transportData.map((item) => (
                    <TransportCard key={item.id} item={item} />
                ))}
            </main>
        </div>
    );
}
