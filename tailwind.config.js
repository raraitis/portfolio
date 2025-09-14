/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Alien Encounters', 'Inter', 'system-ui', 'sans-serif'],
        alien: ['Alien Encounters', 'Inter', 'sans-serif'],
        'alien-solid': ['Alien Encounters Solid', 'Inter', 'sans-serif'],
        nabla: ['Nabla', 'Inter', 'sans-serif'],
      },
    },
  },
};
