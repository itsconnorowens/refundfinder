/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - warm, approachable sunset theme
        brand: {
          primary: '#A855F7',        // Pleasant purple for CTAs
          'primary-hover': '#9333EA', // Darker purple for hover states
          accent: '#FB923C',          // Coral/orange accent (replaces turquoise)
          'accent-hover': '#F97316',  // Darker coral for hover states
        },
        // Sunset gradient palette (subtle tones)
        sunset: {
          blue: '#EFF6FF',    // blue-50
          purple: '#FAF5FF',  // purple-50
          pink: '#FDF2F8',    // pink-50
          orange: '#FFF7ED',  // orange-50
        },
      },
    },
  },
  plugins: [],
}
