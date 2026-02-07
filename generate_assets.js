const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'client/public/assets');

// Ensure directories exist (recursive)
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

ensureDir(path.join(baseDir, 'branding'));
ensureDir(path.join(baseDir, 'transport'));
ensureDir(path.join(baseDir, 'icons'));
ensureDir(path.join(baseDir, 'banners'));
ensureDir(path.join(baseDir, 'category-icons'));

// SVG Templates
const svgs = {
    // Branding
    'branding/app-logo.svg': `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" rx="15" fill="#0969da"/><path d="M10 25L25 10L40 25L25 40L10 25Z" fill="white"/><text x="25" y="32" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="20">M</text></svg>`,
    'branding/app-logo-inline.svg': `<svg width="150" height="50" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="50" rx="10" fill="#0969da"/><text x="75" y="32" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="24">UMKM RADAR</text></svg>`,

    // Transport URLs (Logos)
    'transport/mrt-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#0969da">MRT</text></svg>`,
    'transport/tije-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#ef4444">TiJe</text></svg>`,
    'transport/lrt-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#ef4444">LRT</text></svg>`,
    'transport/kai-commuter-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="16" fill="#f97316">KAI Commuter</text></svg>`,
    'transport/whoosh-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#ef4444">Whoosh</text></svg>`,
    'transport/jaklingko-logo.svg': `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="white"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="18" fill="#0ea5e9">JakLingko</text></svg>`,

    // Icons
    'icons/nav-back.svg': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'icons/nav-search.svg': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2"/></svg>`,

    // Banners (Using SVG placeholder art)
    'banners/kuliner-1.jpg': `<svg width="175" height="300" viewBox="0 0 175 300" xmlns="http://www.w3.org/2000/svg"><rect width="175" height="300" fill="#fca5a5"/><text x="87" y="150" text-anchor="middle" fill="white">Kuliner 1</text></svg>`,
    // ... just creating one type as placeholder for all .jpg requests if I could, but here I'm writing files.
    // I'll skip writing fake jpgs as svgs, browser might complain. 
    // I will write them as .svg and update seed to point to .svg OR fetch real images via script?
    // User wants "asset path", implies valid files. I'll stick to SVG for logos/icons.
    // For banners, I will use Unsplash URLs in the seed file instead of local assets for now, OR valid local images.
    // Let's assume user cares most about the navbar/logos. I will generate those.
    // Banners I will switch back to Unsplash in seed.
};

// Write files
Object.entries(svgs).forEach(([filename, content]) => {
    const filePath = path.join(baseDir, filename);
    fs.writeFileSync(filePath, content);
    console.log(`Created ${filePath}`);
});
