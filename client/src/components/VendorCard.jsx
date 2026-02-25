import React from 'react';
import { getImageUrl } from '../utils/api';

/**
 * VendorCard — Merchant line up card (Figma node 212:3825)
 *
 * Design spec:
 *  - Card: bg-white, border-0.5 grey-200, rounded-[20px], py-[5px] pl-[6px] pr-[10px]
 *  - Thumbnail: w-[54px] self-stretch, rounded-[15px], object-cover
 *  - Name: 14px Inter semibold, grey-700, truncate, capitalize, tracking-[0.21px]
 *  - Description: 11px Inter medium, grey-400, truncate, tracking-[-0.05px]
 *  - Address: 11px Inter medium, highlight-blue (#0969da), truncate
 *  - Schedule: 14px Inter semibold, grey-500
 *  - Distance chip: absolute bottom-right, bg grey-100, rounded-[7px], p-[5px],
 *    14px Inter semibold, grey-400, lowercase
 */
export default function VendorCard({ vendor, onClick, fallbackEmoji = '🍽️' }) {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-grey-200 flex items-center relative rounded-[20px] py-[5px] pl-[6px] pr-[10px] cursor-pointer hover:shadow-md transition-shadow w-full"
            style={{ borderWidth: '0.5px' }}
        >
            {/* Thumbnail — 54px wide, self-stretch height, rounded-[15px] */}
            <div className="w-[54px] self-stretch flex-shrink-0 rounded-[15px] overflow-hidden bg-grey-100 relative">
                {vendor.image ? (
                    <img
                        src={getImageUrl(vendor.image, { w: 108, h: 130, resize: 'crop' })}
                        alt={vendor.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="absolute inset-0 items-center justify-center text-2xl"
                    style={{ display: vendor.image ? 'none' : 'flex' }}
                >
                    {fallbackEmoji}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-[5px] capitalize py-[10px] pl-[10px]">
                {/* Name — 14px Inter semibold, grey-700 */}
                <p className="font-semibold text-[14px] text-grey-700 truncate leading-[12px] tracking-[0.21px]">
                    {vendor.name}
                </p>

                {/* Description — 11px Inter medium, grey-400 */}
                <p className="font-medium text-[11px] text-grey-400 truncate leading-[12px] tracking-[-0.05px]">
                    {vendor.description || vendor.category || ''}
                </p>

                {/* Address + Schedule with right padding for distance chip */}
                <div className="flex flex-col gap-[10px] pr-[60px]">
                    {/* Address — 11px Inter medium, highlight-blue */}
                    <p className="font-medium text-[11px] text-highlight-blue truncate leading-[12px] tracking-[-0.05px]">
                        {vendor.address || 'Alamat tidak tersedia'}
                    </p>

                    {/* Schedule — 14px Inter semibold, grey-500 */}
                    <p className="font-semibold text-[14px] text-grey-500 leading-[10px]">
                        {vendor.schedule?.open || '06:00'} - {vendor.schedule?.close || '22:00'}
                    </p>
                </div>
            </div>

            {/* Distance Chip — absolute bottom-right */}
            {vendor.distanceLabel && (
                <div className="absolute bottom-[9.5px] right-[10.5px] bg-grey-100 rounded-[7px] p-[5px] flex items-end justify-end">
                    <span className="font-semibold text-[14px] text-grey-400 leading-[10px] lowercase tracking-[-0.05px] not-italic">
                        {vendor.distanceLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
