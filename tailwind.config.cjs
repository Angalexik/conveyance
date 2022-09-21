const colors = require('@carbon/colors');
const spacing = require('@carbon/layout').spacing;
const breakpoints = require('@carbon/layout').breakpoints;

/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		colors: colors.colors,
		spacing: () => {
			const theme_spacing = {
				0: '0px',
				px: '1px'
			};
			spacing.forEach((x, i) => {
				theme_spacing[i + 1] = x;
			});
			return theme_spacing;
		},
		screens: {
			sm: breakpoints.sm.width,
			md: breakpoints.md.width,
			lg: breakpoints.lg.width,
			xlg: breakpoints.xlg.width,
			max: breakpoints.max.width
		},
		extend: {}
	},
	plugins: [require('tailwind-scrollbar')]
};
