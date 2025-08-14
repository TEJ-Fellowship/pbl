import { useThemeStore } from '../store/themeStore'
import { useEffect } from 'react'

export default function ThemeProvider({ children }) {
  const { theme } = useThemeStore()
  
  useEffect(() => {
    // Apply or remove dark class based on theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
      {children}
    </div>
  )
}