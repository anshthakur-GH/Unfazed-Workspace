/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f0f0f',
                accent: '#FF6B00',
                'accent-hover': '#e65a00',
                card: '#1a1a1a',
                border: '#333333',
                text: '#eaeaea',
                'text-muted': '#a0a0a0',
            },
            fontFamily: {
                sans: ['Space Grotesk', 'sans-serif'],
                roboto: ['Roboto', 'sans-serif'],
            },
            borderRadius: {
                'xl': '12px',
            }
        },
    },
    plugins: [],
}
