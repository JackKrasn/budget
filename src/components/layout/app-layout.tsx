import { Outlet, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  CalendarRange,
  Wallet,
  TrendingUp,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  Receipt,
  Banknote,
  FolderOpen,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Главная',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    title: 'Бюджет',
    icon: CalendarRange,
    href: '/budget',
  },
  {
    title: 'Фонды',
    icon: Wallet,
    href: '/funds',
  },
  {
    title: 'Расходы',
    icon: Receipt,
    href: '/expenses',
  },
  {
    title: 'Доходы',
    icon: Banknote,
    href: '/incomes',
  },
  {
    title: 'Категории',
    icon: FolderOpen,
    href: '/categories',
  },
  {
    title: 'Активы',
    icon: TrendingUp,
    href: '/assets',
  },
  {
    title: 'Счета',
    icon: CreditCard,
    href: '/accounts',
  },
  {
    title: 'Аналитика',
    icon: BarChart3,
    href: '/analytics',
  },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <Link to="/" className="flex items-center gap-3 px-2 py-1">
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src={theme === 'light' ? '/logo-light.png' : '/logo.png'}
          alt="Budget Planner Logo"
          className="h-full w-full object-cover"
        />
      </motion.div>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col"
          >
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Budget
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Planner
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: (typeof navItems)[0]
  isActive: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={collapsed ? item.title : undefined}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
        )}
      >
        <Link to={item.href}>
          <motion.div
            className="relative z-10 flex items-center gap-3"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />

      <SidebarHeader className="relative border-b border-sidebar-border/50 px-4 py-4">
        <Logo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="relative px-3 py-4">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={
                item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href)
              }
              collapsed={collapsed}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="relative border-t border-sidebar-border/50 px-3 py-3">
        <SidebarMenu>
          <NavItem
            item={{
              title: 'Настройки',
              icon: Settings,
              href: '/settings',
            }}
            isActive={location.pathname.startsWith('/settings')}
            collapsed={collapsed}
          />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function Header() {
  const { state, toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="md:hidden" />

      {/* Desktop collapse toggle */}
      <motion.button
        onClick={toggleSidebar}
        className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:flex"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: state === 'collapsed' ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  )
}

function MainContent() {
  const location = useLocation()

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="noise-overlay gradient-mesh flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <MainContent />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
