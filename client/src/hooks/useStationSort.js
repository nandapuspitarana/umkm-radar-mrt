import { useState, useEffect } from 'react';

const STATION_KEY = 'umkm_station';
const DEFAULT_STATION = 'Blok M';

/**
 * useStationSort — sorts vendors by active MRT station category (instant, no GPS)
 *
 * Supports two modes:
 *   1. Pre-sorted mode: `vendors` is already a sorted array (from /api/vendors/grouped).
 *      When `preSorted=true`, data is passed through immediately with zero computation.
 *   2. Raw mode (fallback): `vendors` is the full unsorted vendor list.
 *      Hook will filter + sort client-side, same behaviour as before.
 *
 * @param {Array}    vendors    - Vendor list (pre-sorted or full list)
 * @param {Function} filterFn  - Filter fn for raw mode (null when preSorted=true)
 * @param {boolean}  preSorted - Set true when data already sorted by backend
 * @returns {{ sortedVendors, loading, stationCategory }}
 */
export function useStationSort(vendors, filterFn = null, preSorted = false) {
    const [stationCategory] = useState(
        () => localStorage.getItem(STATION_KEY) || DEFAULT_STATION
    );
    const [sortedVendors, setSortedVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const safeVendors = Array.isArray(vendors) ? vendors : [];

        // ── Pre-sorted mode: data came from /api/vendors/grouped, use as-is ──
        if (preSorted) {
            setSortedVendors(safeVendors);
            setLoading(safeVendors.length === 0 && !vendors ? true : false);
            return;
        }

        // ── Raw mode (fallback): filter + sort client-side ──
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
    }, [vendors, stationCategory, preSorted]);

    return { sortedVendors, loading, stationCategory };
}
