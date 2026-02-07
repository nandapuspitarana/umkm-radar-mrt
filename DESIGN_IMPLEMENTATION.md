# Design Implementation & Error Fix Notes

## 1. Homepage Error Fixed (Asset Loading)
The primary issue preventing images from loading on the homepage has been resolved.
- **Root Cause**: There was a mismatch between the database seed structure (nested objects) and the frontend code (expecting flat arrays), plus complexity with serving assets via backend API.
- **Solution**: 
    1. Updated `Home.jsx` and `TransportLinks.jsx` to correctly parse settings data.
    2. **Moved Assets to Static Path**: As requested, critical assets (Navbar Logos, Transport Icons) are now stored directly in `client/public/assets/` and served as static files. This improves reliability and speed.
    3. **Updated Database Seed**: The `998_seed_assets.sql` file now points to these static paths (`/assets/...`) instead of the backend API.

## 2. Figma Design Implementation
The codebase has been aligned with the provided Figma design specs (`node-id=65-1192`).

### Components Aligned:
- **Header**:
    - Implements "Black Ops One" font for station name.
    - Displays dynamic "Mastercard" station branding.
    - Includes Search and Menu interactions.
- **Category Sidebar**:
    - Fixed width (80px) with custom gradient icons matching the Figma color palette.
    - Categories: Rekomen, Publik, Kuliner, Ngopi, Wisata, ATM & Belanja.
- **Story Banners**:
    - **Size**: 175x300px (Portrait) as specified.
    - **Visuals**: Gradient overlay (black/20 to black/80) with bottom-aligned text.
    - **Interaction**: Click to open StoryModal.
- **Transport Links**:
    - **Layout**: Dynamic grid (3 top, 2 bottom for 5 items).
    - **Style**: White cards with centered logos, consistent height (80px/60px).
- **Content Sections**:
    - **Horizontal Scroll**: Implements `no-scrollbar` utility for clean look.
    - **Cards**:
        - Quick Access: 200x200px.
        - WFA / Large: 240x180px.
        - Favorites: 200x133px.
        - Stacked Cards: 200x97px (half height).

### Assets
- **Generated**: SVG assets for MRT, TiJe, LRT, KAI, Whoosh, and Navigation icons have been generated in `client/public/assets`.
- **Banners**: Reverted to high-quality Unsplash images for a premium look, matching the "rich aesthetics" requirement.

## Troubleshooting
If images do not appear immediately:
1. Hard refresh the browser (`Ctrl+Shift+R`).
2. Ensure the `generate_assets.js` script ran successfully (check `client/public/assets` folder).
3. If database data looks old, run `cd backend && node seed.js` (ensure `DB_NAME=umkmradar` is set).
