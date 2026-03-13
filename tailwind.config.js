/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#1a1a24',
        surface3: '#22222f',
        border: '#2a2a3a',
        accent: '#6c63ff',
        accent2: '#ff6b6b',
        accent3: '#00d4aa',
        accent4: '#ffa94d',
        txt: '#e8e8f0',
        txt2: '#9090a8',
        txt3: '#5a5a72',
        pass: '#00d4aa',
        fail: '#ff6b6b',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        modalIn: 'modalIn 0.2s ease',
        toastIn: 'toastIn 0.2s ease',
        fadeIn: 'fadeIn 0.3s ease',
      },
    },
  },
  plugins: [],
}
