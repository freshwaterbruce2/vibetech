import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				aura: {
					background: 'hsl(var(--aura-background))',
					backgroundLight: 'hsl(var(--aura-background-light))',
					accent: 'hsl(var(--aura-accent))',
					accentSecondary: 'hsl(var(--aura-accent-secondary))',
					text: 'hsl(var(--aura-text))', 
					textSecondary: 'hsl(var(--aura-text-secondary))',
					neonBlue: '#00f0ff',
					neonPurple: '#9b00ff',
					neonCyan: '#00e8ff',
					neonOrange: '#ff7b00',
					darkBg: '#0f1219',
					darkBgLight: '#171c26'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Montserrat', 'sans-serif'],
				body: ['Open Sans', 'sans-serif'],
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'glow': {
					'0%': {
						opacity: '1',
						textShadow: '0 0 20px rgba(155, 0, 255, 0.8), 0 0 30px rgba(155, 0, 255, 0.6), 0 0 40px rgba(155, 0, 255, 0.4)'
					},
					'50%': {
						opacity: '0.8',
						textShadow: '0 0 10px rgba(155, 0, 255, 0.5), 0 0 20px rgba(155, 0, 255, 0.3), 0 0 30px rgba(155, 0, 255, 0.2)'
					},
					'100%': {
						opacity: '1',
						textShadow: '0 0 20px rgba(155, 0, 255, 0.8), 0 0 30px rgba(155, 0, 255, 0.6), 0 0 40px rgba(155, 0, 255, 0.4)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'pulse-ring': {
					'0%': {
						transform: 'scale(0.8)',
						opacity: '0.8'
					},
					'70%': {
						transform: 'scale(1.3)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(0.8)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow': 'glow 2.5s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite'
			},
			boxShadow: {
				'neon': '0 0 5px rgba(155, 0, 255, 0.2), 0 0 20px rgba(155, 0, 255, 0.2)',
				'neon-lg': '0 0 10px rgba(155, 0, 255, 0.3), 0 0 30px rgba(155, 0, 255, 0.2), 0 0 50px rgba(155, 0, 255, 0.1)',
				'neon-cyan': '0 0 5px rgba(0, 255, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.2)',
				'neon-blue': '0 0 5px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
				'neon-purple': '0 0 5px rgba(155, 0, 255, 0.5), 0 0 20px rgba(155, 0, 255, 0.3)',
				'neon-cyan': '0 0 5px rgba(0, 232, 255, 0.5), 0 0 20px rgba(0, 232, 255, 0.3)',
				'neon-orange': '0 0 5px rgba(255, 123, 0, 0.5), 0 0 20px rgba(255, 123, 0, 0.3)'
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
