import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Default fallback paths (static SVG di public/)
const DEFAULT_TRANSPORT_ICONS = {
    MRT: '/assets/transport/mrt-logo.svg',
    TiJe: '/assets/transport/tije-logo.svg',
    JakLingko: '/assets/transport/jaklingko-logo.svg',
    KAI: '/assets/transport/kai-commuter-logo.svg',
    LRT: '/assets/transport/lrt-logo.svg',
    Whoosh: '/assets/transport/whoosh-logo.svg',
};

// Session cache — tidak re-fetch setiap render
let _iconCache = null;

// Hook: ambil custom icons dari settings, merge dengan default
function useTransportIcons() {
    const [icons, setIcons] = useState(_iconCache || DEFAULT_TRANSPORT_ICONS);
    useEffect(() => {
        if (_iconCache) return;
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                const custom = data.transport_icons || {};
                const merged = { ...DEFAULT_TRANSPORT_ICONS };
                Object.entries(custom).forEach(([k, v]) => {
                    if (v) merged[k] = `/api/raw/${v.replace(/^\//, '')}`;
                });
                _iconCache = merged;
                setIcons(merged);
            })
            .catch(() => { _iconCache = DEFAULT_TRANSPORT_ICONS; });
    }, []);
    return icons;
}

export default function DestinationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [destination, setDestination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const transportIcons = useTransportIcons();

    useEffect(() => {
        fetchDestination();
    }, [id]);

    const fetchDestination = async () => {
        try {
            const response = await fetch(`/api/destinations/${id}`);
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            setDestination(data);
        } catch (error) {
            console.error('Failed to fetch destination:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-grey-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!destination) {
        return (
            <div className="min-h-screen bg-grey-100 flex flex-col items-center justify-center gap-3 px-6">
                <span className="text-5xl">📍</span>
                <p className="text-grey-600 font-semibold">Destinasi tidak ditemukan</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-primary font-bold text-sm underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const openingHours = destination.openingHours || destination.opening_hours || '06:00 - 20:00';
    const distanceFromStation = destination.distanceFromStation ?? destination.distance_from_station ?? null;
    const nearestStation = destination.nearestStation || destination.nearest_station || '';

    const formatDistance = (distanceInKm) => {
        if (!distanceInKm || distanceInKm === 0) return '0 m';
        if (distanceInKm < 1) return `${Math.round(distanceInKm * 1000)} m`;
        return `${distanceInKm.toFixed(1)} km`;
    };

    const FALLBACK_IMAGES = {
        'Wisata Alam': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop',
        'Wisata Sejarah': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3b7?w=600&h=400&fit=crop',
        'Wisata Budaya': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop',
        default: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop',
    };

    const heroImage = (!imgError && destination.image)
        ? destination.image
        : (FALLBACK_IMAGES[destination.category] || FALLBACK_IMAGES.default);

    return (
        <div className="min-h-screen bg-grey-100 relative overflow-hidden">
            {/* ========== STICKY HEADER ========== */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-[25px] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between py-[10px] h-[64px]">
                    <div className="flex items-center gap-[10px] flex-1 pl-[17px] pr-[15px]">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-grey-100 transition-colors flex-shrink-0"
                            aria-label="Kembali"
                        >
                            <ChevronLeft size={22} className="text-grey-700" />
                        </button>

                        <div className="flex-1 min-w-0 capitalize overflow-hidden">
                            <p className="font-black text-[15px] text-[#242424] tracking-[0.225px] leading-normal overflow-hidden text-ellipsis whitespace-nowrap">
                                {destination.name}
                            </p>
                            <p className="font-semibold text-[13px] text-grey-600 tracking-[-0.05px] leading-[10px] mt-[4px]">
                                {openingHours}
                            </p>
                        </div>

                        {distanceFromStation !== null && (
                            <div className="bg-primary text-white rounded-[50px] px-[10px] pb-[8px] pt-[6px] flex items-center gap-[2px] flex-shrink-0">
                                <span className="font-bold text-[15px] tracking-[0.225px] lowercase leading-none">
                                    {formatDistance(distanceFromStation)}
                                </span>
                                <div className="transform -rotate-90">
                                    <ChevronRight size={11} className="text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== SCROLLABLE CONTENT ========== */}
            <div className="pb-[30px]">
                {/* Hero Image — sticky tepat di bawah header (64px) */}
                <div className="sticky top-[64px] h-[250px] w-full bg-grey-200 overflow-hidden">
                    <img
                        src={heroImage}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Cards */}
                <div className="relative z-10 flex flex-col gap-[10px] px-[10px] mt-[10px]">

                    {/* Description Card */}
                    <div className="bg-white border-[0.5px] border-grey-200 rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.2)] px-[25px] py-[20px]">
                        <p className="font-medium text-[14px] text-grey-600 leading-[26px] whitespace-pre-wrap">
                            {destination.description || 'Informasi deskripsi belum tersedia untuk destinasi ini.'}
                        </p>
                    </div>

                    {/* Access Route Card */}
                    <div className="bg-white rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.2)] px-[5px] pt-[5px] pb-[20px]">
                        {/* Header grey pill */}
                        <div className="bg-grey-200 rounded-[20px] p-[10px] mb-[20px]">
                            <p className="font-bold text-[14px] text-black text-center capitalize leading-[22px]">
                                Akses menuju {destination.name}
                            </p>
                        </div>

                        {/* Route Steps Container */}
                        <div className="flex flex-col gap-[20px] px-[10px] relative">
                            {/* Connector line */}
                            <div
                                className="absolute bg-grey-200"
                                style={{ left: '29px', top: '20px', bottom: '20px', width: '2px', zIndex: 0 }}
                            />

                            <RouteStep
                                icons={transportIcons}
                                icon="MRT"
                                title={nearestStation || 'Stasiun MRT Senayan Mastercard'}
                                subtitle="posisi kamu sekarang"
                            />
                            <RouteStep
                                icons={transportIcons}
                                icon="MRT"
                                title={nearestStation || 'MRT Senayan Mastercard'}
                                subtitle="Arah Bundaran HI"
                            />
                            <RouteStep
                                icons={transportIcons}
                                icon="TiJe"
                                title="Halte TransJakarta"
                                subtitle="Koridor 1 (Blok M – Kota)"
                            />
                            <RouteStep
                                icons={transportIcons}
                                icon="Destination"
                                title={destination.name}
                                subtitle={distanceFromStation
                                    ? `±${formatDistance(distanceFromStation)} dari halte`
                                    : '±100 meter dari halte'
                                }
                            />
                        </div>
                    </div>

                    {/* Ticket Price Card */}
                    {(destination.ticketPrice || destination.ticket_price) && (
                        <div className="bg-white border-[0.5px] border-grey-200 rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.2)] px-[20px] py-[15px] flex items-center gap-[10px]">
                            <span className="text-[18px]">🎟️</span>
                            <div>
                                <p className="font-bold text-[13px] text-grey-700">Harga Tiket</p>
                                <p className="font-medium text-[13px] text-grey-600">
                                    {destination.ticketPrice || destination.ticket_price}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ========== Route Step Component ==========
function RouteStep({ icons, icon, title, subtitle }) {
    const isDestination = icon === 'Destination';
    const imgSrc = icons?.[icon] || DEFAULT_TRANSPORT_ICONS[icon];

    return (
        <div className="flex items-center gap-[15px] relative" style={{ zIndex: 1 }}>
            {/* Icon container — white bg, rounded-[50px] sesuai Figma */}
            <div
                className="bg-white rounded-[50px] flex items-center justify-center flex-shrink-0 p-[5px]"
                style={{ width: '40px', height: '40px' }}
            >
                {isDestination ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#0969DA" />
                    </svg>
                ) : imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={icon}
                        className="w-[30px] h-[30px] object-contain"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                ) : null}
            </div>

            {/* Text — sesuai Figma: medium 14px title, regular 12px subtitle */}
            <div className="flex flex-col gap-[7px] capitalize text-grey-700 min-w-0">
                <p className="font-medium text-[14px] leading-[12px]">
                    {title}
                </p>
                <p className="font-normal text-[12px] leading-[12px] text-grey-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
