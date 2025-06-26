import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface dark:bg-surface-dark"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}