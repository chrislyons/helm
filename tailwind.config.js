/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-light': 'var(--color-sky-light)',
        'sky-medium': 'var(--color-sky-medium)',
        'sky-dark': 'var(--color-sky-dark)',
        'sky-accent': 'var(--color-sky-accent)',
        'sky-divider': 'var(--color-sky-divider)',
      },
    },
  },
  plugins: [],
}
