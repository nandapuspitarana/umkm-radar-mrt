import React from 'react';

export default function ContentSection({ title, children }) {
    return (
        <div className="flex flex-col gap-2.5 w-full">
            {/* Section Header */}
            <div className="px-5 pt-2">
                <h3 className="font-bold text-sm capitalize text-black">
                    {title}
                </h3>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5 px-2.5 pb-2">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Content Card Component
export function ContentCard({
    image,
    title,
    subtitle,
    distance,
    size = 'medium', // 'small' | 'medium' | 'large' | 'tall'
    onClick
}) {
    const sizeClasses = {
        small: 'w-[133px] h-[133px]',
        medium: 'w-[200px] h-[200px]',
        large: 'w-[240px] h-[180px]',
        tall: 'w-[175px] h-[300px]',
    };

    return (
        <div
            className={`${sizeClasses[size]} overflow-hidden rounded-2xl relative flex-shrink-0 cursor-pointer group`}
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
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    <span className="text-white text-sm">📍</span>
                    <span className="text-white text-sm font-semibold lowercase">{distance}</span>
                </div>
            )}

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-grey-200 font-bold text-lg leading-tight capitalize">
                    {title}
                </p>
                {subtitle && (
                    <p className="text-grey-200 font-semibold text-sm capitalize">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
