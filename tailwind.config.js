/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wheat: {
          50: '#FFFCF5', 100: '#FFFAF0', 200: '#FFF3D6',
          300: '#F5D5A0', 400: '#E8C882', 500: '#D4B065',
          600: '#B89450', 700: '#9A7A3D', 800: '#7D622C',
        },
        mint: {
          50: '#F6FCF9', 100: '#EBF8F2', 200: '#C5EBDB',
          300: '#A8D8C8', 400: '#8EC9B5', 500: '#7BC8A4',
          600: '#6AAA8C', 700: '#5A9078', 800: '#4A7A65',
        },
        coral: {
          300: '#F0C4A0', 400: '#E8A87C', 500: '#D4916A', 600: '#C07D55',
        },
        warm: {
          50: '#FAF7F2', 100: '#F5F0E8', 200: '#F0E8DC',
          300: '#D4C9B5', 400: '#B8A88E', 500: '#9B8B7A',
          600: '#7A6D5E', 700: '#5D4E37', 800: '#3D3425', 900: '#1E1B18',
        },
      },
      borderRadius: {
        xl: '12px', '2xl': '16px', '3xl': '20px',
      },
      fontFamily: {
        sans: ['-apple-system','BlinkMacSystemFont','"Segoe UI"','"PingFang SC"','"Hiragino Sans GB"','"Microsoft YaHei"','"Noto Sans SC"','sans-serif'],
      },
      animation: {
        shake: 'shake 0.6s ease-in-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'fade-in': 'fadeIn 0.25s ease',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
        heartbeat: 'heartbeat 0.4s ease',
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(8deg)' },
          '60%': { transform: 'rotate(-5deg)' },
          '80%': { transform: 'rotate(3deg)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' }, '100%': { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
