import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
  isLoading: boolean
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  toggleTheme: () => null,
  isDark: false,
  isLoading: true,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to get system theme preference
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper function to get stored theme from localStorage
const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    return null
  } catch {
    return null
  }
}

// Helper function to apply theme to DOM immediately
const applyThemeToDOM = (theme: Theme) => {
  if (typeof window === 'undefined') return
  
  const root = window.document.documentElement
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark')
  
  // Add new theme class
  root.classList.add(theme)
  
  // Store in localStorage
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Ignore localStorage errors
  }
}

// Initialize theme before React hydration to prevent flash
const initializeTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  
  // Priority: stored theme > system preference > default light
  const stored = getStoredTheme()
  const theme = stored ?? getSystemTheme()
  
  // Apply immediately to prevent flash
  applyThemeToDOM(theme)
  
  return theme
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'theme',
  ...props 
}: {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
} & React.ComponentProps<'div'>) {
  // Always start with default theme to prevent hydration mismatch
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize theme on mount and listen for system changes
  useEffect(() => {
    const storedTheme = getStoredTheme()
    const systemTheme = getSystemTheme()
    const initialTheme = storedTheme ?? systemTheme
    
    // Set state and apply to DOM
    setThemeState(initialTheme)
    applyThemeToDOM(initialTheme)
    setIsLoading(false)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no stored preference
      if (!getStoredTheme()) {
        const newTheme = e.matches ? 'dark' : 'light'
        setThemeState(newTheme)
        applyThemeToDOM(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Theme setter that updates both state and DOM immediately
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyThemeToDOM(newTheme)
  }

  // Toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLoading,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

// Export helper for manual theme initialization (for SSR)
export { initializeTheme, applyThemeToDOM }