import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')

    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: theme === 'dark' ? 0 : 1,
          rotate: theme === 'dark' ? -90 : 0,
          scale: theme === 'dark' ? 0.5 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Sun className="h-4 w-4 text-sidebar-accent-foreground" />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          opacity: theme === 'dark' ? 1 : 0,
          rotate: theme === 'dark' ? 0 : 90,
          scale: theme === 'dark' ? 1 : 0.5,
        }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Moon className="h-4 w-4 text-sidebar-accent-foreground" />
      </motion.div>
    </motion.button>
  )
}
