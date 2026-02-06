/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0969da',        // Blue primary (was green #2D6A4F)
                'primary-dark': '#0550ae', // Darker blue (was #1B4332)
                accent: '#FF6B35',
                'accent-light': '#FFB4A2',
                bg: '#FDFAF6',
                // New colors from Figma design
                'blue-icon': '#3D6D9A',
                'soft-orange': '#FDDC8F',
                'grey-100': '#eaeef2',
                'grey-200': '#d0d7de',
                'grey-300': '#afb8c1',
                'grey-600': '#57606a',
                'highlight-blue': '#0969da',
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                serif: ['Fraunces', 'serif'],
                display: ['"Black Ops One"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
