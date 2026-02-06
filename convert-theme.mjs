#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Color mapping from green to blue
const colorMap = {
    'green-50': 'blue-50',
    'green-100': 'blue-100',
    'green-200': 'blue-200',
    'green-300': 'blue-300',
    'green-400': 'blue-400',
    'green-500': 'blue-500',
    'green-600': 'blue-600',
    'green-700': 'blue-700',
    'green-800': 'blue-800',
    'green-900': 'blue-900',
    'accent-green': 'accent-blue',
    'text-green': 'text-blue',
    'bg-green': 'bg-blue',
    'border-green': 'border-blue',
    'ring-green': 'ring-blue',
    'shadow-green': 'shadow-blue',
    'hover:bg-green': 'hover:bg-blue',
    'hover:text-green': 'hover:text-blue',
    'focus:ring-green': 'focus:ring-blue',
    'from-green': 'from-blue',
    'to-green': 'to-blue',
};

function replaceInFile(filePath) {
    try {
        let content = readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace each green color with blue
        for (const [green, blue] of Object.entries(colorMap)) {
            if (content.includes(green)) {
                content = content.replace(new RegExp(green, 'g'), blue);
                modified = true;
            }
        }

        if (modified) {
            writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return 1;
        }
        return 0;
    } catch (err) {
        console.error(`❌ Error processing ${filePath}:`, err.message);
        return 0;
    }
}

function processDirectory(dir, extensions = ['.jsx', '.tsx', '.js', '.ts']) {
    let count = 0;
    const items = readdirSync(dir);

    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip node_modules and dist
            if (item === 'node_modules' || item === 'dist' || item === 'build') {
                continue;
            }
            count += processDirectory(fullPath, extensions);
        } else if (stat.isFile()) {
            const ext = item.substring(item.lastIndexOf('.'));
            if (extensions.includes(ext)) {
                count += replaceInFile(fullPath);
            }
        }
    }

    return count;
}

// Main execution
console.log('🎨 Converting green theme to blue theme...\n');

const clientSrc = './client/src';
const dashboardSrc = './dashboard/src';

let totalFiles = 0;

console.log('📁 Processing client...');
totalFiles += processDirectory(clientSrc);

console.log('\n📁 Processing dashboard...');
totalFiles += processDirectory(dashboardSrc);

console.log(`\n✨ Done! Updated ${totalFiles} files.`);
console.log('🔄 Please restart your dev server to see the changes.\n');
