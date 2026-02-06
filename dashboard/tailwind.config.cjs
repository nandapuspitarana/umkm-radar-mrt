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
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                serif: ['Fraunces', 'serif'],
            }
        },
    },
    plugins: [],
}
