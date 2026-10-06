/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BizOS Editorial Palette
        bg: '#EDF6F1',
        primary: {
          DEFAULT: '#285C4D',
          dark: '#1d453a',
          light: '#377764',
          subtle: '#E6F0EB',
        },
        dark: {
          DEFAULT: '#17211D',
          muted: '#4A5B53',
          light: '#6B7E76'
        },
        surface: {
          DEFAULT: '#FAFCFA',
          subtle: '#F4F8F5'
        },
        soft: '#DCEBE4',
        border: {
          DEFAULT: '#D4E2DC',
          dark: '#B8CEC4'
        },
        warning: {
          DEFAULT: '#C89445',
          light: '#FAF4EB',
          border: '#EAD7BA',
          text: '#946625'
        },
        danger: {
          DEFAULT: '#B65D59',
          light: '#FBF0EF',
          border: '#E6BFBD',
          text: '#8C3E3A'
        },
        success: {
          DEFAULT: '#285C4D',
          light: '#EAF3EF',
          border: '#C8DCD2',
          text: '#1E473B'
        },
        muted: '#5A6E65',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(23, 33, 29, 0.04)',
        card: '0 2px 4px rgba(23, 33, 29, 0.03), 0 1px 2px rgba(23, 33, 29, 0.02)',
      }
    },
  },
  plugins: [],
};
