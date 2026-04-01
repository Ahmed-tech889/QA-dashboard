/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        syne:    ['Syne', 'sans-serif'],
        dm:      ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg:       '#e2e2e6',
        surface:  '#f5f5f8',
        surface2: '#ebebee',
        surface3: '#dcdce0',
        border:   '#d0d0d6',
        accent:   '#2563eb',
        accent2:  '#e11d48',
        accent3:  '#16a34a',
        accent4:  '#d97706',
        txt:      '#1a1a2e',
        txt2:     '#505060',
        txt3:     '#8888a0',
        pass:     '#16a34a',
        fail:     '#e11d48',
        warn:     '#d97706',
      },
      keyframes: {
        modalIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        modalIn: 'modalIn 0.2s ease',
        toastIn: 'toastIn 0.2s ease',
        fadeIn:  'fadeIn 0.3s ease',
      },
    },
  },
  plugins: [],
}
