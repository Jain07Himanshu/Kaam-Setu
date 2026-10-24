/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2A7C13',
          primaryDark: '#1E5B0E',
          primaryLight: '#389A1B',
          surface: '#EBF7E7',
          
          secondary: '#76C457',
          secondaryDark: '#5E9E45',
          secondaryLight: '#94D77B',

          cream: '#FFF8CF',
          creamLight: '#FFFDF0',

          beige: '#FBE6C2',
          beigeLight: '#FDF4E7',
        },
        surface: {
          base: '#FDFBF7',
          card: '#FFFFFF',
          subtle: '#F9FAFB',
          border: '#E5E7EB',
        },
        charcoal: '#1F2937',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(42, 124, 19, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        hover: '0 8px 16px -4px rgba(42, 124, 19, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
