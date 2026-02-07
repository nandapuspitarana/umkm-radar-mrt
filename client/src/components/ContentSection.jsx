import React from 'react';
import { MapPin } from 'lucide-react';

export default function ContentSection({ title, children }) {
    return (
        <div className="flex flex-col gap-[10px] w-full">
            {/* Section Header - Figma matching */}
            <div className="flex gap-[5px] items-center pl-[20px] pr-[10px] pt-[10px]">
                <h3 className="font-bold text-[15px] capitalize text-black leading-normal">
                    {title}
                </h3>
            </div>

            {/* Horizontal Scroll Container - Figma matching */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-[5px] px-[10px]">
                    {children}
                    {/* Right margin element */}
                    <div className="w-[5px] h-[67px] flex-shrink-0" />
                </div>
            </div>
        </div>
    );
}

// Content Card Component - Matching Figma sizes exactly
export function ContentCard({
    image,
    title,
    subtitle,
    distance,
    size = 'medium', // 'small' | 'medium' | 'large' | 'tall' | 'half'
    onClick
}) {
    // Figma exact sizes
    const sizeClasses = {
        small: 'w-[200px] h-[133px]',    // Favorite places
        medium: 'w-[200px] h-[200px]',   // Quick access
        large: 'w-[240px] h-[180px]',    // WFA section
        tall: 'w-[175px] h-[300px]',     // Story banners
        half: 'w-[200px] h-[97px]',      // Half height for stacked items
    };

    return (
        <div
            className={`${sizeClasses[size]} overflow-hidden rounded-[15px] relative flex-shrink-0 cursor-pointer group`}
            onClick={onClick}
        >
            {/* Background Image */}
            {image ? (
                <img
                    src={image}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-grey-200 flex items-center justify-center">
                    <span className="text-4xl opacity-50">📷</span>
                </div>
            )}

            {/* Gradient Overlay - Figma: from 20% black to 80% black */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

            {/* Distance Badge - Figma position */}
            {distance && (
                <div className="absolute top-[20px] left-[20px] flex items-center gap-[6px]">
                    <MapPin size={12} className="text-white" />
                    <span className="text-white text-[14px] font-semibold lowercase">{distance}</span>
                </div>
            )}

            {/* Title Container - Figma: bottom-[15px] left/right-[20px] */}
            <div className="absolute bottom-0 left-0 right-0 pb-[15px] px-[20px]">
                <p className="text-grey-200 font-bold text-[18px] leading-normal capitalize overflow-hidden text-ellipsis">
                    {title}
                </p>
                {subtitle && (
                    <p className="text-grey-200 font-bold text-[18px] leading-normal capitalize">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

// Smaller card variant for favorite places
export function FavoriteCard({
    image,
    title,
    distance,
    onClick
}) {
    return (
        <div
            className="w-[200px] h-[133px] overflow-hidden rounded-[15px] relative flex-shrink-0 cursor-pointer group"
            onClick={onClick}
        >
            {/* Background Image */}
            {image ? (
                <img
                    src={image}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-grey-200 flex items-center justify-center">
                    <span className="text-4xl opacity-50">📷</span>
                </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

            {/* Distance Badge */}
            {distance && (
                <div className="absolute top-[20px] left-[20px] flex items-center gap-[6px]">
                    <MapPin size={12} className="text-white" />
                    <span className="text-white text-[14px] font-semibold lowercase">{distance}</span>
                </div>
            )}

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 pb-[15px] px-[20px]">
                <p className="text-grey-200 font-semibold text-[14px] leading-normal capitalize overflow-hidden text-ellipsis whitespace-pre-wrap">
                    {title}
                </p>
            </div>
        </div>
    );
}

// Stacked cards component (like ATM + Minimarket)
export function StackedCards({
    items,
    onClick
}) {
    return (
        <div className="flex flex-col gap-[5px] w-[200px] h-[200px] flex-shrink-0">
            {items.map((item, index) => (
                <div
                    key={item.id || index}
                    className="flex-1 overflow-hidden rounded-[15px] relative cursor-pointer group"
                    onClick={() => onClick && onClick(item)}
                >
                    {/* Background Image */}
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-grey-200 flex items-center justify-center">
                            <span className="text-2xl opacity-50">📷</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 pb-[15px] px-[20px]">
                        <p className="text-grey-200 font-bold text-[18px] leading-normal capitalize">
                            {item.title}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
