import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';

// MRT Logo — sesuai Figma (garis MRT biru)
function IconMRT() {
    return (
        <div className="w-[30px] h-[30px] flex items-center justify-center">
            <svg width="30" height="25" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12.5C2 6.70101 6.70101 2 12.5 2H17.5C23.299 2 28 6.70101 28 12.5C28 18.299 23.299 23 17.5 23H12.5C6.70101 23 2 18.299 2 12.5Z" fill="#0969DA" />
                <path d="M8 9L12 13L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 13V17" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 17H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M19 9V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 9V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 13H22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// TransJakarta Logo
function IconTiJe() {
    return (
        <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #e8511a 0%, #f07030 100%)' }}>
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-white font-black text-[10px] tracking-tight">TiJe</span>
            </div>
        </div>
    );
}

export default function DestinationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [destination, setDestination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

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
                <MapPin size={40} className="text-grey-300" />
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

    // Drizzle mengembalikan camelCase dari PostgreSQL snake_case
    // Tapi juga support keduanya untuk safety
    const openingHours = destination.openingHours || destination.opening_hours || '06:00 - 20:00';
    const distanceFromStation = destination.distanceFromStation ?? destination.distance_from_station ?? null;
    const nearestStation = destination.nearestStation || destination.nearest_station || '';
    const stationType = destination.stationType || destination.station_type || 'MRT';

    const formatDistance = (distanceInKm) => {
        if (!distanceInKm || distanceInKm === 0) return '0 m';
        if (distanceInKm < 1) {
            const meters = Math.round(distanceInKm * 1000);
            return `${meters} m`;
        }
        return `${distanceInKm.toFixed(1)} km`;
    };

    // Fallback image per kategori wisata
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
            <div className="sticky top-0 z-50 backdrop-blur-[25px] bg-white/95 overflow-hidden shadow-sm">
                {/* Status Bar Placeholder */}
                <div className="h-[36px]" />

                {/* Header Content */}
                <div className="flex items-center justify-between py-[10px] h-[64px]">
                    <div className="flex items-center gap-[10px] flex-1 pl-[17px] pr-[15px]">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="w-[24px] h-[24px] flex items-center justify-center transform rotate-90 flex-shrink-0"
                            aria-label="Kembali"
                        >
                            <ChevronRight size={24} className="text-black" />
                        </button>

                        {/* Title and Operating Hours */}
                        <div className="flex-1 min-w-0 capitalize overflow-hidden">
                            <p className="font-black text-[15px] text-[#242424] tracking-[0.225px] leading-normal overflow-hidden text-ellipsis whitespace-nowrap">
                                {destination.name}
                            </p>
                            <p className="font-semibold text-[13px] text-grey-600 tracking-[-0.05px] leading-[10px] mt-[4px] overflow-hidden">
                                {openingHours}
                            </p>
                        </div>

                        {/* Distance Badge */}
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
                {/* Hero Image — sticky behind cards */}
                <div className="sticky top-[100px] h-[250px] w-full bg-grey-200 overflow-hidden">
                    <img
                        src={heroImage}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                    {/* Dark overlay at bottom for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Cards — scroll over the sticky hero image */}
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

                        {/* Route Steps Container — connector line INSIDE this div */}
                        <div className="flex flex-col gap-[20px] px-[10px] relative">
                            {/*
                              Connector line positioning:
                              - Container has px-[10px] = 10px left padding
                              - Icon is 40px wide → center at 10 + 20 = 30px from container left
                              - Line width 2px → starts at 30 - 1 = 29px
                              - top/bottom: 20px = half of 40px icon height (not 0, to stay between icons)
                            */}
                            <div
                                className="absolute bg-grey-200"
                                style={{
                                    left: '29px',
                                    top: '20px',
                                    bottom: '20px',
                                    width: '2px',
                                    zIndex: 0,
                                }}
                            />

                            {/* Step 1: Current Position */}
                            <RouteStep
                                icon="MRT"
                                title={nearestStation || 'Stasiun MRT Senayan Mastercard'}
                                subtitle="posisi kamu sekarang"
                            />

                            {/* Step 2: Board MRT direction */}
                            <RouteStep
                                icon="MRT"
                                title={nearestStation || 'MRT Senayan Mastercard'}
                                subtitle="Arah Bundaran HI"
                            />

                            {/* Step 3: TransJakarta */}
                            <RouteStep
                                icon="TiJe"
                                title="Halte TransJakarta"
                                subtitle="Koridor 1 (Blok M – Kota)"
                            />

                            {/* Step 4: Destination (pin icon) */}
                            <RouteStep
                                icon="Destination"
                                title={destination.name}
                                subtitle={
                                    distanceFromStation
                                        ? `±${formatDistance(distanceFromStation)} dari halte`
                                        : '±100 meter dari halte'
                                }
                            />
                        </div>
                    </div>

                    {/* Extra info card — ticket price & contact if available */}
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
function RouteStep({ icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-[15px] relative" style={{ zIndex: 1 }}>
            {/* Icon container — white bg to "cut" the connector line */}
            <div
                className="bg-white rounded-full flex items-center justify-center flex-shrink-0"
                style={{ width: '40px', height: '40px' }}
            >
                {icon === 'MRT' && <IconMRT />}
                {icon === 'TiJe' && <IconTiJe />}
                {icon === 'Destination' && (
                    <MapPin size={22} className="text-primary" fill="currentColor" />
                )}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-[5px] capitalize text-grey-700 min-w-0">
                <p className="font-medium text-[14px] leading-[1.2]">
                    {title}
                </p>
                <p className="font-normal text-[12px] leading-[1.2] text-grey-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
