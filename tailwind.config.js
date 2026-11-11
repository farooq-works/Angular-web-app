/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0f1e',
        brand: '#3b82f6',
        violet: '#8b5cf6',
        mist: '#f5f7fb'
      },
      boxShadow: {
        card: '0 20px 55px rgba(15, 23, 42, .10)',
        glow: '0 18px 45px rgba(59, 130, 246, .28)'
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '100% 50%' } }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 7s ease infinite'
      }
    }
  },
  plugins: []
};
