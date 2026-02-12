# Destination Detail Page Implementation

## Overview
Implemented destination detail page for tourism destinations based on Figma design (node-id: 743-19332).

## Files Created/Modified

### 1. **New Page Component**
**File:** `client/src/pages/DestinationDetail.jsx`
- Full-screen detail page for individual destinations
- Sticky header with back button and distance badge
- Hero image (sticky at top)
- Description card with tourism information
- Access route card showing transportation steps

### 2. **Updated Routing**
**File:** `client/src/App.jsx`
- Added import for `DestinationDetail` component
- Added route: `/wisata/:id` for destination detail pages

### 3. **Updated Wisata Page**
**File:** `client/src/pages/Wisata.jsx`
- Added `useNavigate` hook import
- Made destination cards clickable
- Cards now navigate to `/wisata/{id}` on click

### 4. **Backend API Endpoints**
**File:** `backend/src/index.ts`
- Added `GET /api/destinations` - Get all destinations
- Added `GET /api/destinations/:id` - Get single destination by ID

## Design Features

### Header (Sticky with Backdrop Blur)
- **Back Button**: Rotated chevron (90°) to navigate back
- **Title**: Destination name (capitalize, truncated)
- **Subtitle**: "150 m dari lokasi kamu"
- **Distance Badge**: Blue pill with distance and chevron
- **Backdrop Blur**: `backdrop-blur-[25px]` with `bg-white/95`

### Hero Image
- **Height**: 250px
- **Position**: Sticky at `top-[100px]`
- **Full width** with object-cover

### Description Card
- **Background**: White with border and shadow
- **Padding**: 25px horizontal, 20px vertical
- **Border**: 0.5px grey-200
- **Shadow**: `0px 4px 15px rgba(0,0,0,0.2)`
- **Text**: 14px, grey-600, line-height 26px

### Access Route Card
- **Background**: White with shadow
- **Connector Line**: Vertical grey line connecting all steps
- **Header**: Grey-200 background with centered title
- **Route Steps**: 4 steps showing transportation route
  1. Current Location (MRT icon)
  2. MRT Direction (MRT icon)
  3. TransJakarta (TiJe icon)
  4. Destination (Pin icon)

### Route Step Component
- **Icon Container**: 40px circle, white background
- **Icons**: 
  - MRT: Custom SVG
  - TiJe: Orange circle with "TJ" text
  - Destination: MapPin filled icon
- **Text**: 
  - Title: 14px medium, grey-700
  - Subtitle: 12px normal, grey-700
- **Gap**: 15px between icon and text

## Spacing & Layout

```
Header: 100px total (36px status bar + 64px content)
Hero Image: 250px sticky
Content Gap: 10px
Card Padding: 10px horizontal
Card Gap: 10px between cards
Bottom Padding: 30px
```

## Navigation Flow

```
Wisata Page → Click Card → Destination Detail
              ↓
         /wisata/:id
              ↓
    DestinationDetail Component
              ↓
    Fetch from /api/destinations/:id
```

## API Response Format

```json
{
  "id": 1,
  "name": "Monumen Nasional (Monas)",
  "category": "alam-ruang-terbuka",
  "description": "Monumen Nasional atau Monas adalah ikon Jakarta...",
  "lat": -6.1754,
  "lng": 106.8272,
  "nearest_station": "Stasiun MRT Senayan",
  "station_type": "MRT",
  "distance_from_station": 4.7,
  "image": "https://..."
}
```

## Distance Formatting

Same as Wisata page:
- **< 1 km**: Show in meters (e.g., "300 m")
- **≥ 1 km**: Show in kilometers (e.g., "4.7 km")

## Styling Tokens

```css
Colors:
- Primary: #0969da (blue)
- Grey 100: #eaeef2 (background)
- Grey 200: #d0d7de (borders, light text)
- Grey 600: #57606a (body text)
- Grey 700: #424a53 (headings)
- Dark: #242424 (titles)

Shadows:
- Card: 0px 4px 15px rgba(0,0,0,0.2)

Border Radius:
- Cards: 20px
- Pills: 50px
- Images: 15px
```

## Next Steps

1. ✅ Create DestinationDetail component
2. ✅ Add routing in App.jsx
3. ✅ Make cards clickable in Wisata.jsx
4. ✅ Add API endpoints for destinations
5. ⏳ Test navigation flow
6. ⏳ Add loading states
7. ⏳ Add error handling
8. ⏳ Implement actual transportation route data
9. ⏳ Add map integration (optional)

## Notes

- The route steps are currently hardcoded for Monas example
- In production, route information should come from the database
- Consider adding:
  - Opening hours
  - Ticket prices
  - User reviews
  - Photo gallery
  - Map view
  - Share functionality
