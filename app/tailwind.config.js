import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'Figtree',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			// Medical theme colors
    			medical: {
    				primary: "#2563eb", // Medical blue
    				secondary: "#06b6d4", // Light blue
    				success: "#059669", // Green for successful payments
    				warning: "#d97706", // Orange for warnings
    				danger: "#dc2626", // Red for errors
    				gray: "#6b7280", // Medical gray
    			},
    			// Cash register specific colors
    			cash: {
    				open: "#10b981", // Green for open register
    				closed: "#ef4444", // Red for closed register
    				pending: "#f59e0b", // Yellow for pending
    			},
    			border: "hsl(var(--border))",
    			input: "hsl(var(--input))",
    			ring: "hsl(var(--ring))",
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			keyframes: {
    				"accordion-down": {
    					from: { height: "0" },
    					to: { height: "var(--radix-accordion-content-height)" },
    				},
    				"accordion-up": {
    					from: { height: "var(--radix-accordion-content-height)" },
    					to: { height: "0" },
    				},
    			},
    			animation: {
    				"accordion-down": "accordion-down 0.2s ease-out",
    				"accordion-up": "accordion-up 0.2s ease-out",
    			},
    		}
    	}
    },

    plugins: [forms, require("tailwindcss-animate")],
};
