/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Dynamic classes used in template literals (bg/text/border colors)
    { pattern: /bg-(red|green|blue|yellow|orange|purple|gray|indigo)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-(red|green|blue|yellow|orange|purple|gray|indigo|white)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-(red|green|blue|yellow|orange|purple|gray|indigo)-(100|200|300|400|500|600)/ },
    // Hover variants explicitly used
    'hover:bg-blue-700', 'hover:bg-gray-300', 'hover:bg-gray-400', 'hover:bg-gray-50',
    'hover:bg-green-200', 'hover:bg-green-700', 'hover:bg-indigo-700',
    'hover:bg-opacity-30', 'hover:bg-purple-100', 'hover:bg-purple-200',
    'hover:bg-purple-50', 'hover:bg-purple-700', 'hover:bg-red-200',
    'hover:bg-red-50', 'hover:bg-red-700', 'hover:bg-yellow-600', 'hover:bg-yellow-700',
    'hover:border-blue-400', 'hover:border-green-400', 'hover:border-purple-400',
    'hover:border-purple-600', 'hover:border-yellow-400',
    'hover:text-gray-600', 'hover:text-gray-700', 'hover:text-purple-600',
    'hover:text-purple-700', 'hover:text-purple-800', 'hover:text-red-700',
    'hover:text-white', 'hover:underline',
    // Active variants
    'active:bg-purple-200',
    // Responsive (sm:) variants explicitly used
    'sm:col-span-1', 'sm:col-span-2', 'sm:flex-row', 'sm:gap-2', 'sm:gap-3',
    'sm:gap-4', 'sm:gap-6', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4',
    'sm:grid-cols-5', 'sm:h-10', 'sm:h-32', 'sm:inline', 'sm:items-center',
    'sm:mb-2', 'sm:mb-3', 'sm:mb-4', 'sm:mb-6', 'sm:mb-8', 'sm:mr-2', 'sm:mt-4',
    'sm:p-3', 'sm:p-4', 'sm:p-6', 'sm:p-8', 'sm:pt-4', 'sm:px-3', 'sm:px-4',
    'sm:px-6', 'sm:py-2', 'sm:py-3', 'sm:py-4', 'sm:py-5', 'sm:py-8',
    'sm:text-2xl', 'sm:text-3xl', 'sm:text-4xl', 'sm:text-base', 'sm:text-lg',
    'sm:text-sm', 'sm:text-xl', 'sm:w-10', 'sm:w-32',
    // Other dynamic classes
    'bg-opacity-20', 'bg-opacity-50',
    'col-span-2', 'col-span-3',
    'cursor-not-allowed', 'cursor-pointer',
    '-translate-y-1/2',
    '-webkit-overflow-scrolling-touch',
  ],
}
