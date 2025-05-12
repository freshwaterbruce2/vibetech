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
					neonBlue: 'var(--c-cyan)',
					neonPurple: 'var(--c-purple)',
					neonCyan: 'var(--c-cyan)',
					neonOrange: '#ff7b00',
					neonGreen: '#00ff66',
					neonPink: '#ff00e4',
					darkBg: 'var(--bg-start)',
					darkBgLight: '#12141c'
				},
				
				// Updated futuristic colors to match 2025-grade spec
				futuristic: {
					neonBlue: 'var(--c-cyan)',
					neonPurple: 'var(--c-purple)', 
					neonTeal: '#00FFCC',
					darkBg: 'var(--bg-start)',
					darkBgLight: 'var(--bg-mid)',
					glassOverlay: 'var(--glass-bg)',
					cardBorder: 'rgba(0, 240, 255, 0.3)'
				},
				
				// Define these colors directly to enable opacity variants
				cyan: 'var(--c-cyan)',
				purple: 'var(--c-purple)',
				teal: '#00FFCC',
			},
			backgroundImage: {
				'radial-tech': 'radial-gradient(at 50% 75%,var(--bg-start) 0%,var(--bg-mid) 45%,var(--bg-end) 100%),url("/assets/circuit.svg")',
				'hero-gradient': 'radial-gradient(at 50% 75%, #0B0B17 0%, #111125 50%, #14182C 100%), url("/assets/circuit.svg")'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
				heading: ['Montserrat Variable', 'Montserrat', 'sans-serif'],
				body: ['Inter Variable', 'Inter', 'sans-serif'],
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
				
				// Updated animations for 2025-grade microinteractions
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
						boxShadow: '0 0 20px rgba(40, 240, 255, 0.7), 0 0 30px rgba(40, 240, 255, 0.5)'
					},
					'50%': {
						opacity: '0.7',
						boxShadow: '0 0 10px rgba(40, 240, 255, 0.5), 0 0 15px rgba(40, 240, 255, 0.3)'
					}
				},
				'flicker-border': {
					'0%, 100%': { borderColor: 'rgba(40, 240, 255, 0.3)' },
					'50%': { borderColor: 'rgba(40, 240, 255, 0.1)' }
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
				},
				'hover-float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			},
			animation: {
				
				// Updated animations for 2025-grade microinteractions
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
				'melt-toggle': 'melt-toggle 0.2s ease-in-out forwards',
				'hover-float': 'hover-float 2s ease-in-out infinite'
			},
			backgroundImage: {
				
				'futuristic-gradient': 'linear-gradient(135deg, #0B0B17 0%, #111125 100%)',
				'accent-gradient': 'linear-gradient(90deg, #28f0ff 0%, #9c57ff 50%, #00ffcc 100%)',
				'neon-sweep-gradient': 'linear-gradient(90deg, #28f0ff 0%, #9c57ff 33%, #00ffcc 66%, #28f0ff 100%)',
				'circuit-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cpath fill='%2328f0ff' fill-opacity='0.05' d='M20 13C18.22 13 17 14.22 17 16s1.22 3 3 3 3-1.22 3-3-1.22-3-3-3zM15 3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM30 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM20 46h8v4h-8v-4zM15 30c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM13 34v6H7v-6h6zM90 10c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM89 19h-8v-8h8v8zM95 85c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5z'/%3E%3C/svg%3E\")",
				'circuit-pattern-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cpath fill='%2328f0ff' fill-opacity='0.05' d='M20 13C18.22 13 17 14.22 17 16s1.22 3 3 3 3-1.22 3-3-1.22-3-3-3zM15 3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM30 50c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM20 46h8v4h-8v-4zM15 30c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM13 34v6H7v-6h6zM90 10c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM89 19h-8v-8h8v8zM95 85c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5z'/%3E%3C/svg%3E\")"
			},
			boxShadow: {
				
				// Updated shadow effects for 2025-grade UI
				'neon': '0 0 5px rgba(40, 240, 255, 0.4), 0 0 20px rgba(40, 240, 255, 0.2)',
				'neon-lg': '0 0 10px rgba(40, 240, 255, 0.5), 0 0 30px rgba(40, 240, 255, 0.3), 0 0 50px rgba(40, 240, 255, 0.1)',
				'neon-blue': '0 0 10px rgba(40, 240, 255, 0.7), 0 0 20px rgba(40, 240, 255, 0.4)',
				'neon-purple': '0 0 10px rgba(156, 87, 255, 0.7), 0 0 20px rgba(156, 87, 255, 0.4)',
				'neon-teal': '0 0 10px rgba(0, 255, 204, 0.7), 0 0 20px rgba(0, 255, 204, 0.4)',
				'neon-blue-soft': '0 0 10px rgba(40, 240, 255, 0.2)',
				'neon-purple-soft': '0 0 10px rgba(156, 87, 255, 0.2)',
				'neon-teal-soft': '0 0 10px rgba(0, 255, 204, 0.2)',
				'glassmorphic': '0 8px 32px 0 rgba(11, 11, 23, 0.3)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
