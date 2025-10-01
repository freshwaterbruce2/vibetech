import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  setDarkMode: (value: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true) // Dark mode by default

  useEffect(() => {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('vibestay-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'light') {
      setIsDarkMode(false)
      document.body.classList.add('light-mode')
    } else if (savedTheme === 'dark' || prefersDark) {
      setIsDarkMode(true)
      document.body.classList.remove('light-mode')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev
      if (newValue) {
        document.body.classList.remove('light-mode')
        localStorage.setItem('vibestay-theme', 'dark')
      } else {
        document.body.classList.add('light-mode')
        localStorage.setItem('vibestay-theme', 'light')
      }
      return newValue
    })
  }

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value)
    if (value) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('vibestay-theme', 'dark')
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('vibestay-theme', 'light')
    }
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}