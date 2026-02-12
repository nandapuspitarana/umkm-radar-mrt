import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';

export default function DestinationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [destination, setDestination] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDestination();
    }, [id]);

    const fetchDestination = async () => {
        try {
            const response = await fetch(`/api/destinations/${id}`);
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
            <div className="min-h-screen bg-grey-100 flex items-center justify-center">
                <p className="text-grey-600">Destinasi tidak ditemukan</p>
            </div>
        );
    }

    const formatDistance = (distanceInKm) => {
        if (!distanceInKm || distanceInKm === 0) return '0 m';
        if (distanceInKm < 1) {
            const meters = Math.round(distanceInKm * 1000);
            return `${meters} m`;
        }
        return `${distanceInKm.toFixed(1)} km`;
    };

    return (
        <div className="min-h-screen bg-grey-100 relative">
            {/* Header with backdrop blur */}
            <div className="sticky top-0 z-50 backdrop-blur-[25px] bg-white overflow-hidden">
                {/* Status Bar Placeholder */}
                <div className="h-[36px]"></div>

                {/* Header Content */}
                <div className="flex items-center justify-between py-[10px] h-[64px]">
                    <div className="flex items-center gap-[10px] flex-1 pl-[17px] pr-[15px]">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="w-[24px] h-[24px] flex items-center justify-center transform rotate-90"
                        >
                            <ChevronRight size={24} className="text-black" />
                        </button>

                        {/* Title and Subtitle */}
                        <div className="flex-1 min-w-0 capitalize">
                            <div className="font-black text-[15px] text-[#242424] tracking-[0.225px] truncate overflow-hidden leading-normal">
                                <p className="leading-normal overflow-hidden">{destination.name}</p>
                            </div>
                            <p className="font-semibold text-[13px] text-grey-600 tracking-[-0.05px] leading-[10px] mt-2 overflow-hidden w-full">
                                {destination.opening_hours || '06:00 - 20:00'}
                            </p>
                        </div>

                        {/* Distance Badge */}
                        <div className="bg-primary text-white rounded-[50px] px-[10px] py-[6px] flex items-center gap-1">
                            <span className="font-bold text-[15px] tracking-[0.225px] lowercase">
                                {formatDistance(destination.distance_from_station)}
                            </span>
                            <div className="transform -rotate-90">
                                <ChevronRight size={11} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="overflow-y-auto pb-[30px]">
                {/* Hero Image - Sticky */}
                <div className="sticky top-[100px] h-[250px] w-full">
                    <img
                        src={destination.image || 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop'}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content Cards */}
                <div className="flex flex-col gap-[10px] px-[10px] mt-[10px]">
                    {/* Description Card */}
                    <div className="bg-white border-[0.5px] border-grey-200 rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.2)] px-[25px] py-[20px]">
                        <p className="font-medium text-[14px] text-grey-600 leading-[26px] whitespace-pre-wrap">
                            {destination.description || 'Monumen Nasional atau Monas adalah ikon Jakarta sekaligus penanda perjalanan panjang Indonesia sebagai bangsa. Di dalamnya terdapat museum sejarah yang menggambarkan perjuangan rakyat Indonesia sejak masa penjajahan hingga kemerdekaan. Area taman yang luas menjadikan Monas tempat favorit keluarga untuk belajar sejarah sambil bersantai. Dari puncaknya, pengunjung bisa melihat panorama Jakarta dari ketinggian, menjadikan kunjungan ke Monas bukan hanya edukatif, tapi juga berkesan.'}
                        </p>
                    </div>

                    {/* Access Route Card */}
                    <div className="bg-white rounded-[20px] shadow-[0px_4px_15px_0px_rgba(0,0,0,0.2)] px-[5px] py-[5px] pb-[20px] relative">
                        {/* Connector Line */}
                        <div className="absolute left-[35px] top-0 bottom-0 w-[2px] bg-grey-300"></div>

                        {/* Header */}
                        <div className="bg-grey-200 rounded-[20px] p-[10px] mb-[20px]">
                            <p className="font-bold text-[14px] text-black text-center capitalize leading-[22px]">
                                Akses menuju {destination.name}
                            </p>
                        </div>

                        {/* Route Steps */}
                        <div className="flex flex-col gap-[20px] px-[10px]">
                            {/* Step 1: Current Location */}
                            <RouteStep
                                icon="MRT"
                                title="Stasiun MRT Senayan Mastercard"
                                subtitle="posisi kamu sekarang"
                            />

                            {/* Step 2: MRT Direction */}
                            <RouteStep
                                icon="MRT"
                                title="MRT Senayan Mastercard"
                                subtitle="Arah Bundaran HI"
                            />

                            {/* Step 3: TransJakarta */}
                            <RouteStep
                                icon="TiJe"
                                title="Halte TransJakarta"
                                subtitle="Koridor 1 (Blok M – Kota)"
                            />

                            {/* Step 4: Destination */}
                            <RouteStep
                                icon="Destination"
                                title={destination.name}
                                subtitle="±100 meter dari halte"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Route Step Component
function RouteStep({ icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-[15px] relative z-10">
            {/* Icon */}
            <div className="bg-white rounded-[50px] p-[5px] w-[40px] h-[40px] flex items-center justify-center flex-shrink-0">
                {icon === 'MRT' && (
                    <div className="w-[30px] h-[30px] flex items-center justify-center">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                            <path d="M15 8L8 15L15 22" stroke="#0969da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 15H8" stroke="#0969da" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
                {icon === 'TiJe' && (
                    <div className="w-[30px] h-[30px] bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-[12px]">TJ</span>
                    </div>
                )}
                {icon === 'Destination' && (
                    <MapPin size={24} className="text-primary" fill="currentColor" />
                )}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-[7px] capitalize text-grey-700">
                <p className="font-medium text-[14px] leading-[12px]">
                    {title}
                </p>
                <p className="font-normal text-[12px] leading-[12px]">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
