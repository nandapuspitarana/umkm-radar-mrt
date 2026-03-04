import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
    const [stationName, setStationName] = useState('BLOK M BCA');

    useEffect(() => {
        // Try to get station from local storage, default to 'BLOK M BCA'
        const saved = localStorage.getItem('umkm_station') || 'BLOK M BCA';
        setStationName(saved.toUpperCase());

        // Auto close after 3.5 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 3500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#eaeef2] flex items-center justify-center overflow-hidden">
            {/* Background Map - Simulated with an abstract pattern or we can use a soft gray background */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%239C92AC\\" fill-opacity=\\"0.4\\"%3E%3Cpath d=\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
            ></div>

            {/* Gradients */}
            <div className="absolute top-0 left-0 right-0 h-[206px] bg-gradient-to-b from-white via-white/50 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[206px] bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none"></div>

            {/* Main Card Container */}
            <div className="relative z-10 w-[286px] h-[348px] bg-white border-[6px] border-[#24292f] rounded-[54px] shadow-2xl flex flex-col items-center justify-start pt-[30px] px-4 animate-in fade-in zoom-in duration-700">

                {/* Radar Map Pin Graphic */}
                <div className="relative w-full h-[120px] mb-4 flex items-center justify-center">
                    {/* Radar Circles */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[80px] border border-teal-400 rounded-[100%] opacity-30 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[60px] border border-teal-500 rounded-[100%] opacity-50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[40px] border border-teal-600 rounded-[100%] opacity-70"></div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[75px] bg-gradient-to-t from-teal-200/40 to-transparent rounded-[100%]"></div>

                    {/* Map Pin */}
                    <div className="relative z-10 w-[60px] h-[80px] -mt-10 animate-bounce" style={{ animationDuration: '2s' }}>
                        <svg viewBox="0 0 24 24" fill="#002685" stroke="white" strokeWidth="1" className="w-full h-full drop-shadow-md">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="3" fill="white" />
                        </svg>
                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[24px] h-[24px] bg-white rounded-full overflow-hidden">
                            {/* Dummy profile or center icon */}
                            <img src="/logo192.png" alt="logo" className="w-full h-full object-cover p-1" onError={(e) => { e.target.style.display = 'none' }} />
                        </div>
                    </div>

                    {/* Pin shadow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[15px] w-[10px] h-[4px] bg-gray-900/60 rounded-[100%]"></div>
                </div>

                {/* Texts */}
                <p className="font-medium text-sm text-center text-gray-800 mb-2">
                    kamu sedang berada di Wilayah
                </p>
                <div className="font-bold text-[18px] text-center text-black leading-tight mb-8 px-2 max-w-[200px]">
                    {stationName}
                </div>

                {/* Button */}
                <button
                    onClick={onComplete}
                    className="absolute bottom-6 w-[156px] py-2.5 px-4 bg-[#002685] hover:bg-blue-800 transition-colors rounded-full text-white font-bold text-base shadow-lg border-2 border-[#002685] ring-2 ring-white ring-inset focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                    Mulai Eksplor
                </button>
            </div>
        </div>
    );
}
