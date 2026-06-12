import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('notala-theme') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('notala-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full text-xs bg-cream-200 text-warm-500 border border-warm-100 rounded-full py-2 px-3 flex items-center justify-center gap-1 hover:bg-cream-300"
    >
      {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
      {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  )
}

export default ThemeToggle