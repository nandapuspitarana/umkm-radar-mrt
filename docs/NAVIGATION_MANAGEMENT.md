# Navigation Management System

## Overview
Sistem manajemen navigasi untuk UMKM Radar MRT yang memungkinkan admin mengelola menu navigasi di header, footer, dan sidebar secara dinamis dari dashboard.

## Features

### ✅ Backend (API)
- **Database Schema**: Tabel `navigation_items` dengan support untuk:
  - Parent-child relationships (nested menus)
  - Multiple positions (header, footer, sidebar)
  - External links
  - Authentication requirements
  - Visibility control
  - Custom ordering
  
- **API Endpoints**:
  - `GET /api/navigation` - Get all navigation items (with optional position filter)
  - `GET /api/navigation/:id` - Get single navigation item
  - `POST /api/navigation` - Create new navigation item
  - `PUT /api/navigation/:id` - Update navigation item
  - `DELETE /api/navigation/:id` - Delete navigation item
  - `POST /api/navigation/reorder` - Reorder navigation items

### ✅ Frontend (Dashboard)
- **Navigation Management Page** (`/navigation`):
  - Full CRUD interface
  - Position filter (All, Header, Footer, Sidebar)
  - Add/Edit form with:
    - Label and path/URL
    - Icon support (emoji or icon name)
    - Position selector
    - Parent menu dropdown (for sub-menus)
    - Sort order
    - External link checkbox
    - Visibility toggle
    - Authentication requirement checkbox
  - Table view with:
    - Visual indicators for external links and auth requirements
    - Visibility toggle button
    - Edit & Delete actions
  - Sidebar navigation link (admin only)

## Database Schema

```sql
CREATE TABLE navigation_items (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,                    -- Menu label
    path TEXT NOT NULL,                     -- URL path
    icon TEXT,                              -- Icon name or emoji
    parent_id INTEGER REFERENCES navigation_items(id), -- For nested menus
    position TEXT NOT NULL DEFAULT 'header', -- 'header', 'footer', 'sidebar'
    sort_order INTEGER DEFAULT 0,           -- Display order
    is_external BOOLEAN DEFAULT false,      -- External link?
    is_visible BOOLEAN DEFAULT true,        -- Show/hide
    requires_auth BOOLEAN DEFAULT false,    -- Login required?
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_navigation_position ON navigation_items(position);
CREATE INDEX idx_navigation_visible ON navigation_items(is_visible);
CREATE INDEX idx_navigation_sort ON navigation_items(sort_order);
CREATE INDEX idx_navigation_parent ON navigation_items(parent_id);
```

## Default Navigation Items

### Header Navigation
| Label | Path | Icon | Sort Order |
|-------|------|------|------------|
| Beranda | / | 🏠 | 0 |
| Kuliner | /kuliner | 🍽️ | 1 |
| Ngopi | /ngopi | ☕ | 2 |
| Wisata | /wisata | 🎭 | 3 |
| ATM & Belanja | /atm-belanja | 🏪 | 4 |

### Footer Navigation
| Label | Path | Sort Order |
|-------|------|------------|
| Tentang Kami | /about | 0 |
| Kontak | /contact | 1 |
| Kebijakan Privasi | /privacy | 2 |
| Syarat & Ketentuan | /terms | 3 |

## API Usage

### Get All Navigation Items
```http
GET /api/navigation
Response: [
  {
    "id": 1,
    "label": "Beranda",
    "path": "/",
    "icon": "🏠",
    "parentId": null,
    "position": "header",
    "sortOrder": 0,
    "isExternal": false,
    "isVisible": true,
    "requiresAuth": false,
    "createdAt": "2026-02-06T..."
  },
  ...
]
```

### Filter by Position
```http
GET /api/navigation?position=header
GET /api/navigation?position=footer
GET /api/navigation?position=sidebar
```

### Create Navigation Item
```http
POST /api/navigation
Content-Type: application/json

{
  "label": "Promo",
  "path": "/promo",
  "icon": "🎁",
  "position": "header",
  "sortOrder": 5,
  "isExternal": false,
  "isVisible": true,
  "requiresAuth": false
}
```

### Create Sub-Menu
```http
POST /api/navigation
Content-Type: application/json

{
  "label": "Kopi Susu",
  "path": "/ngopi/kopi-susu",
  "parentId": 3,  // ID of "Ngopi" menu
  "position": "header",
  "sortOrder": 0,
  "isVisible": true
}
```

### Update Navigation Item
```http
PUT /api/navigation/1
Content-Type: application/json

{
  "label": "Home",
  "isVisible": false
}
```

### Delete Navigation Item
```http
DELETE /api/navigation/1
Response: {
  "message": "Navigation item deleted successfully"
}
```

### Reorder Items
```http
POST /api/navigation/reorder
Content-Type: application/json

{
  "items": [
    { "id": 1, "sortOrder": 0 },
    { "id": 2, "sortOrder": 1 },
    { "id": 3, "sortOrder": 2 }
  ]
}
```

## Frontend Integration

### Client App Usage

Create a `Navigation` component to fetch and render navigation items:

```jsx
import { useState, useEffect } from 'react';

function Navigation({ position = 'header' }) {
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        fetch(`/api/navigation?position=${position}`)
            .then(res => res.json())
            .then(data => {
                // Filter only visible items
                const visible = data.filter(item => item.isVisible);
                setNavItems(visible);
            });
    }, [position]);

    return (
        <nav>
            {navItems.map(item => (
                <a 
                    key={item.id} 
                    href={item.path}
                    target={item.isExternal ? '_blank' : '_self'}
                    rel={item.isExternal ? 'noopener noreferrer' : ''}
                >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                </a>
            ))}
        </nav>
    );
}
```

### With Nested Menus

```jsx
function buildMenuTree(items) {
    const tree = [];
    const map = {};

    // Create map
    items.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });

    // Build tree
    items.forEach(item => {
        if (item.parentId) {
            map[item.parentId]?.children.push(map[item.id]);
        } else {
            tree.push(map[item.id]);
        }
    });

    return tree;
}

function Navigation({ position = 'header' }) {
    const [menuTree, setMenuTree] = useState([]);

    useEffect(() => {
        fetch(`/api/navigation?position=${position}`)
            .then(res => res.json())
            .then(data => {
                const visible = data.filter(item => item.isVisible);
                setMenuTree(buildMenuTree(visible));
            });
    }, [position]);

    return (
        <nav>
            {menuTree.map(item => (
                <div key={item.id}>
                    <a href={item.path}>{item.label}</a>
                    {item.children.length > 0 && (
                        <ul>
                            {item.children.map(child => (
                                <li key={child.id}>
                                    <a href={child.path}>{child.label}</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </nav>
    );
}
```

## Use Cases

### 1. Dynamic Header Menu
- Admin can add/remove menu items without code changes
- Support for dropdown menus (parent-child)
- Custom icons and ordering

### 2. Footer Links
- Manage footer links (About, Contact, Privacy, Terms)
- Easy to add new pages

### 3. Sidebar Navigation
- Category-based navigation
- Quick access links

### 4. Conditional Menus
- Show certain menus only to logged-in users (`requiresAuth`)
- Hide menus temporarily (`isVisible`)

### 5. External Links
- Link to external resources (social media, partner sites)
- Automatically opens in new tab

## Migration Checklist

- [x] Create navigation_items table schema
- [x] Add API endpoints for CRUD operations
- [x] Create Navigation management page in dashboard
- [x] Add navigation link to sidebar (admin only)
- [x] Create migration script for seeding
- [x] Add indexes for performance
- [ ] Integrate navigation component in client app header
- [ ] Integrate navigation component in client app footer
- [ ] Add support for nested menus in client UI
- [ ] Add drag-and-drop reordering in dashboard (optional)

## Testing

### 1. Access Navigation Management
```
http://localhost:5174/navigation
```
(Login as admin required)

### 2. Test CRUD Operations
- Create new menu item
- Edit existing menu item
- Toggle visibility
- Delete menu item
- Create sub-menu (set parent)

### 3. Test Position Filtering
- Filter by Header
- Filter by Footer
- Filter by Sidebar
- View All

### 4. Test API Endpoints
```bash
# Get all navigation items
curl http://localhost:3000/api/navigation

# Get header items only
curl http://localhost:3000/api/navigation?position=header

# Create new item
curl -X POST http://localhost:3000/api/navigation \
  -H "Content-Type: application/json" \
  -d '{"label":"Promo","path":"/promo","position":"header","sortOrder":5}'
```

## Benefits

1. **Flexibility**: Admin can modify navigation without developer intervention
2. **Multi-Position**: Support for header, footer, and sidebar menus
3. **Nested Menus**: Support for dropdown/sub-menus
4. **Visibility Control**: Show/hide menus without deleting
5. **Authentication**: Control which menus require login
6. **External Links**: Support for external URLs
7. **Custom Ordering**: Drag-and-drop or manual sort order
8. **Icon Support**: Emoji or icon names for visual appeal

## Next Steps

1. **Client Integration**: Add Navigation component to client app
2. **Nested Menu UI**: Implement dropdown menus in client
3. **Drag-and-Drop**: Add drag-and-drop reordering in dashboard (optional)
4. **Menu Analytics**: Track which menus are clicked most
5. **A/B Testing**: Test different menu structures
6. **Mega Menus**: Support for complex multi-column menus (future)
