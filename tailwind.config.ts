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
					neonGreen: '#00ff66',
					neonPink: '#ff00e4',
					darkBg: '#0a0c12',
					darkBgLight: '#12141c'
				},
				futuristic: {
					neonBlue: '#00f0ff',
					neonPurple: '#9b00ff', 
					neonTeal: '#00ffcc',
					darkBg: '#0a0c12',
					darkBgLight: '#12141c',
					glassOverlay: 'rgba(18, 20, 28, 0.7)',
					cardBorder: 'rgba(0, 240, 255, 0.3)'
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
				body: ['Inter', 'sans-serif'],
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
						textShadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 30px rgba(0, 240, 255, 0.6), 0 0 40px rgba(0, 240, 255, 0.4)'
					},
					'50%': {
						opacity: '0.8',
						textShadow: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3), 0 0 30px rgba(0, 240, 255, 0.2)'
					},
					'100%': {
						opacity: '1',
						textShadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 30px rgba(0, 240, 255, 0.6), 0 0 40px rgba(0, 240, 255, 0.4)'
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
				},
				'flicker': {
					'0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
						opacity: '0.99',
						filter: 'brightness(1)'
					},
					'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
						opacity: '0.4',
						filter: 'brightness(0.8)'
					}
				},
				'circuit': {
					'0%': { 
						backgroundPosition: '0% 0%' 
					},
					'100%': { 
						backgroundPosition: '100% 100%' 
					}
				},
				'scan-line': {
					'0%': {
						transform: 'translateY(0)'
					},
					'100%': {
						transform: 'translateY(100vh)'
					}
				},
				'rotate-slow': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				'gradient-shift': {
					'0%': {
						backgroundPosition: '0% 50%'
					},
					'50%': {
						backgroundPosition: '100% 50%'
					},
					'100%': {
						backgroundPosition: '0% 50%'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: '1',
						boxShadow: '0 0 20px rgba(0, 240, 255, 0.7), 0 0 30px rgba(0, 240, 255, 0.5)'
					},
					'50%': {
						opacity: '0.7',
						boxShadow: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 15px rgba(0, 240, 255, 0.3)'
					}
				},
				'flicker-border': {
					'0%, 100%': { borderColor: 'rgba(0, 240, 255, 0.3)' },
					'50%': { borderColor: 'rgba(0, 240, 255, 0.1)' }
				},
				'slice-reveal': {
					'0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
					'100%': { transform: 'scaleX(1)', transformOrigin: 'left' }
				},
				'particle-drift': {
					'0%, 100%': { transform: 'translate(0, 0)' },
					'25%': { transform: 'translate(2px, 2px)' },
					'50%': { transform: 'translate(0, 4px)' },
					'75%': { transform: 'translate(-2px, 2px)' }
				},
				'neon-sweep': {
					'0%': { backgroundPosition: '0% 50%' },
					'100%': { backgroundPosition: '200% 50%' }
				},
				'pulse-tab': {
					'0%, 100%': { opacity: '1', transform: 'scaleX(1)' },
					'50%': { opacity: '0.6', transform: 'scaleX(0.95)' }
				},
				'melt-toggle': {
					'0%': { transform: 'scale(0.8) translateX(0)' },
					'100%': { transform: 'scale(1) translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow': 'glow 2.5s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
				'flicker': 'flicker 3s linear infinite',
				'circuit': 'circuit 20s linear infinite',
				'scan-line': 'scan-line 8s linear infinite',
				'rotate-slow': 'rotate-slow 30s linear infinite',
				'gradient-shift': 'gradient-shift 8s ease infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'flicker-border': 'flicker-border 3s infinite ease-in-out',
				'slice-reveal': 'slice-reveal 0.8s ease-out forwards',
				'particle-drift': 'particle-drift 8s infinite ease-in-out',
				'neon-sweep': 'neon-sweep 3s infinite',
				'pulse-tab': 'pulse-tab 2s infinite ease-in-out',
				'melt-toggle': 'melt-toggle 0.3s ease-in-out forwards'
			},
			backgroundImage: {
				'circuit-pattern': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 13C18.22 13 17 14.22 17 16s1.22 3 3 3 3-1.22 3-3-1.22-3-3-3zM15 3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM30 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM20 46h8v4h-8v-4zM15 30c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM13 34v6H7v-6h6zM90 10c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM89 19h-8v-8h8v8zM95 85c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM77 82v6h-6v-6h6zM58 40.1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM58 46v4h-8v-4h8zM45 41c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM70 40c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM76 45v-4h-8v4h8z' fill='rgba(0, 240, 255, 0.08)' fill-rule='evenodd'/%3E%3C/svg%3E\")",
				'futuristic-gradient': 'linear-gradient(135deg, #0a0c12 0%, #12141c 100%)',
				'accent-gradient': 'linear-gradient(90deg, #00f0ff 0%, #9b00ff 50%, #00ffcc 100%)',
				'neon-sweep-gradient': 'linear-gradient(90deg, #00f0ff 0%, #9b00ff 33%, #00ffcc 66%, #00f0ff 100%)',
				'circuit-pattern-dark': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 13C18.22 13 17 14.22 17 16s1.22 3 3 3 3-1.22 3-3-1.22-3-3-3zM15 3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM30 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM20 46h8v4h-8v-4zM15 30c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM13 34v6H7v-6h6zM90 10c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM89 19h-8v-8h8v8zM95 85c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM77 82v6h-6v-6h6zM58 40.1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM58 46v4h-8v-4h8zM45 41c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM70 40c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM76 45v-4h-8v4h8z' fill='rgba(0, 240, 255, 0.06)' fill-rule='evenodd'/%3E%3C/svg%3E\")"
			},
			boxShadow: {
				'neon': '0 0 5px rgba(0, 240, 255, 0.4), 0 0 20px rgba(0, 240, 255, 0.2)',
				'neon-lg': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.3), 0 0 50px rgba(0, 240, 255, 0.1)',
				'neon-blue': '0 0 10px rgba(0, 240, 255, 0.7), 0 0 20px rgba(0, 240, 255, 0.4)',
				'neon-purple': '0 0 10px rgba(155, 0, 255, 0.7), 0 0 20px rgba(155, 0, 255, 0.4)',
				'neon-cyan': '0 0 10px rgba(0, 232, 255, 0.7), 0 0 20px rgba(0, 232, 255, 0.4)',
				'neon-orange': '0 0 10px rgba(255, 123, 0, 0.7), 0 0 20px rgba(255, 123, 0, 0.4)',
				'neon-green': '0 0 10px rgba(0, 255, 102, 0.7), 0 0 20px rgba(0, 255, 102, 0.4)',
				'neon-pink': '0 0 10px rgba(255, 0, 228, 0.7), 0 0 20px rgba(255, 0, 228, 0.4)',
				'neon-blue-soft': '0 0 10px rgba(0, 240, 255, 0.2)',
				'neon-purple-soft': '0 0 10px rgba(155, 0, 255, 0.2)',
				'neon-teal-soft': '0 0 10px rgba(0, 255, 204, 0.2)',
				'glassmorphic': '0 8px 32px 0 rgba(10, 12, 18, 0.3)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
