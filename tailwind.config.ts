
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
				cosmic: {
					purple: '#8B5CF6',
					blue: '#0EA5E9',
					pink: '#D946EF',
					orange: '#F97316',
					darkblue: '#1E293B',
					black: '#0F172A',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px) scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.9)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px 5px rgba(139, 92, 246, 0.4)'
					},
					'50%': {
						boxShadow: '0 0 30px 10px rgba(217, 70, 239, 0.6)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0) rotate(0deg)'
					},
					'25%': {
						transform: 'translateY(-8px) rotate(1deg)'
					},
					'50%': {
						transform: 'translateY(0) rotate(0deg)'
					},
					'75%': {
						transform: 'translateY(8px) rotate(-1deg)'
					}
				},
				'float-slow': {
					'0%, 100%': {
						transform: 'translateY(0) rotate(0deg) scale(1)'
					},
					'25%': {
						transform: 'translateY(-12px) rotate(3deg) scale(1.05)'
					},
					'50%': {
						transform: 'translateY(0) rotate(0deg) scale(1)'
					},
					'75%': {
						transform: 'translateY(12px) rotate(-3deg) scale(0.95)'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(100px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'neon-glow': {
					'0%, 100%': {
						textShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 15px #06b6d4, 0 0 20px #06b6d4'
					},
					'50%': {
						textShadow: '0 0 2px #06b6d4, 0 0 5px #06b6d4, 0 0 8px #06b6d4, 0 0 12px #06b6d4'
					}
				},
				'hologram': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.02)'
					}
				},
				'matrix-rain': {
					'0%': {
						transform: 'translateY(-100vh)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateY(100vh)',
						opacity: '0'
					}
				},
				'gradient-shift': {
					'0%, 100%': {
						backgroundPosition: '0% 50%'
					},
					'50%': {
						backgroundPosition: '100% 50%'
					}
				},
				'bounce-glow': {
					'0%, 100%': {
						transform: 'translateY(0)',
						boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.7)'
					},
					'50%': {
						transform: 'translateY(-10px)',
						boxShadow: '0 10px 20px 0 rgba(139, 92, 246, 0.4)'
					}
				},
				'rotate-3d': {
					'0%': {
						transform: 'rotateY(0deg)'
					},
					'100%': {
						transform: 'rotateY(360deg)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.8s ease-out',
				'scale-in': 'scale-in 0.5s ease-out',
				'pulse-glow': 'pulse-glow 2s infinite',
				'float': 'float 4s ease-in-out infinite',
				'float-slow': 'float-slow 8s ease-in-out infinite',
				'slide-up': 'slide-up 0.6s ease-out forwards',
				'neon-glow': 'neon-glow 2s ease-in-out infinite',
				'hologram': 'hologram 3s ease-in-out infinite',
				'matrix-rain': 'matrix-rain 20s linear infinite',
				'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
				'bounce-glow': 'bounce-glow 2s infinite',
				'rotate-3d': 'rotate-3d 10s linear infinite'
			},
			backdropBlur: {
				'xs': '2px',
				'3xl': '64px'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
