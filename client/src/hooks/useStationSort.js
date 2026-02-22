import { useState, useEffect } from 'react';

const STATION_KEY = 'umkm_station';
const DEFAULT_STATION = 'Senayan Mastercard';

/**
 * useStationSort — sorts vendors by active MRT station category (instant, no GPS)
 * @param {Array} vendors - Full vendor list
 * @param {Function} filterFn - Optional function to pre-filter by page (e.g. only kuliner)
 * @returns {{ sortedVendors, loading, stationCategory }}
 */
export function useStationSort(vendors, filterFn = null) {
    const [stationCategory] = useState(
        () => localStorage.getItem(STATION_KEY) || DEFAULT_STATION
    );
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const safeVendors = Array.isArray(vendors) ? vendors : [];
        const source = filterFn ? safeVendors.filter(filterFn) : safeVendors;

        if (source.length === 0) {
            // Wait for data to arrive; keep loading if vendors not yet loaded
            if (safeVendors.length > 0 || !vendors) {
                setSortedVendors([]);
                setLoading(false);
            }
            return;
        }

        const stationLower = stationCategory.toLowerCase();

        const sorted = [...source].sort((a, b) => {
            const aTag = (a.locationTags || a.location_tags || '').toLowerCase();
            const bTag = (b.locationTags || b.location_tags || '').toLowerCase();
            const aMatch = aTag.includes(stationLower);
            const bMatch = bTag.includes(stationLower);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        setSortedVendors(sorted);
        setLoading(false);
    }, [vendors, stationCategory]);

    return { sortedVendors, loading, stationCategory };
}
