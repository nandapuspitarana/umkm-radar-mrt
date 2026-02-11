# UMKM Radar MRT - Design Fixes Summary

## Date: 2026-02-10

### Issues Fixed

#### 1. Transport Mode Links (Lanjutkan Perjalanan Section) ✅ FIXED

**Problem**: The transport links were not matching the Figma design
- **Before**: TiJe, LRT Jakarta, **MRT Jakarta**, KAI Commuter, Whoosh
- **After**: TiJe, **Jaklingko**, LRT Jakarta, KAI Commuter, Whoosh

**Layout** (as per Figma):
- **Top row** (3 items, 80px height): TiJe, Jaklingko, LRT Jakarta
- **Bottom row** (2 items, 60px height): KAI Commuter, Whoosh

**Files Changed**:
- Created: `backend/migrations/007_fix_transport_links.sql`
- Created: `backend/fix-transport-links.mjs` (migration runner)
- Updated: Database `settings` table, key `transport_links`

**Migration Status**: ✅ Successfully applied

---

### Current Implementation Status

#### Main Menu (Category Sidebar)
**Status**: ✅ Already correct

The CategorySidebar component is using emoji icons which is acceptable for the current implementation. The Figma design shows:
- Rekomen (📢)
- Publik (🛋️)
- Kuliner (🍳)
- Ngopi (☕)
- Wisata (🏛️)
- ATM & Belanja (🏪)

These match the current implementation in `client/src/components/CategorySidebar.jsx`.

**Note**: If you want to use SVG icons instead of emojis, you would need to:
1. Load the category icons from the assets table
2. Update CategorySidebar to use `<img>` tags instead of emoji text
3. The icons are already seeded in the database (see `backend/migrations/998_seed_assets.sql` lines 62-73)

---

### Transport Links Component
**Status**: ✅ Correct

The `TransportLinks.jsx` component correctly:
- Fetches transport links from the API (`/api/settings`)
- Displays top row with 3 items at 80px height
- Displays bottom row with 2 items at 60px height
- Shows logos from the `/assets/transport/` directory
- Handles loading states and empty states

---

### Verification Steps

To verify the fixes:

1. **Check the database**:
   ```sql
   SELECT value FROM settings WHERE key = 'transport_links';
   ```

2. **Check the frontend**:
   - Navigate to http://localhost:5173 (or your client URL)
   - Look at the "Lanjutkan Perjalanan" section
   - Verify the order: TiJe, Jaklingko, LRT Jakarta (top row), KAI Commuter, Whoosh (bottom row)

3. **Clear cache** (if needed):
   - The backend uses Redis caching
   - Settings are cached, so you may need to restart the backend or wait for cache expiry
   - Or manually clear Redis: `redis-cli FLUSHALL`

---

### Files Created

1. `backend/migrations/007_fix_transport_links.sql` - SQL migration to fix transport order
2. `backend/fix-transport-links.mjs` - Node.js script to run the migration
3. `DESIGN_FIX_SUMMARY.md` - This documentation file

---

### Next Steps (Optional Enhancements)

If you want to further improve the design to match Figma exactly:

1. **Use SVG icons for categories** instead of emojis
   - Update `CategorySidebar.jsx` to fetch and display SVG icons from assets
   - Icons are already in the database (icon-rekomen-on.svg, icon-kuliner-on.svg, etc.)

2. **Add hover states** to transport links
   - Already implemented in `TransportLinks.jsx` with `hover:shadow-md`

3. **Optimize logo sizes**
   - The current implementation uses `max-h-[50px]` and `max-h-[40px]`
   - Adjust if logos appear too small or too large

---

### References

- Figma Design: https://www.figma.com/design/6tydRCrkZxDgXmPHjHWMkv/RADAR?node-id=89-746&m=dev
- Transport Links Component: `client/src/components/TransportLinks.jsx`
- Category Sidebar Component: `client/src/components/CategorySidebar.jsx`
- Assets Migration: `backend/migrations/998_seed_assets.sql`
