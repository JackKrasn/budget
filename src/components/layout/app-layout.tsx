import { Outlet, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarRange,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  Receipt,
  Banknote,
  FolderOpen,
  Building2,
  Home,
  ArrowUpDown,
  Landmark,
  PieChart,
  Repeat,
  SlidersHorizontal,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { HeaderRates } from '@/components/layout/header-rates'
import { GlobalOverdueAlert } from '@/features/budget'
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// Навигация с группами
const navGroups = [
  {
    id: 'core',
    label: 'Основное',
    icon: Home,
    items: [
      { title: 'Главная', icon: LayoutDashboard, href: '/' },
      { title: 'Бюджет', icon: CalendarRange, href: '/budget' },
    ],
  },
  {
    id: 'operations',
    label: 'Операции',
    icon: ArrowUpDown,
    items: [
      { title: 'Все операции', icon: ArrowUpDown, href: '/operations' },
      { title: 'Расходы', icon: Receipt, href: '/expenses' },
      { title: 'Доходы', icon: Banknote, href: '/incomes' },
    ],
  },
  {
    id: 'assets',
    label: 'Активы',
    icon: Landmark,
    items: [
      { title: 'Счета', icon: Building2, href: '/accounts' },
      { title: 'Фонды', icon: Wallet, href: '/funds' },
      { title: 'Активы', icon: TrendingUp, href: '/assets' },
      { title: 'Кредиты', icon: CreditCard, href: '/credits' },
    ],
  },
  {
    id: 'insights',
    label: 'Аналитика',
    icon: PieChart,
    items: [
      { title: 'Отчёты', icon: BarChart3, href: '/analytics' },
    ],
  },
  {
    id: 'management',
    label: 'Управление',
    icon: SlidersHorizontal,
    items: [
      { title: 'Категории', icon: FolderOpen, href: '/categories' },
      { title: 'Шаблоны', icon: Repeat, href: '/templates' },
      { title: 'Курсы валют', icon: TrendingDown, href: '/exchange-rates' },
    ],
  },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 px-1">
      <motion.div
        className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src="/logo.png"
          alt="Бюджет"
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
              Бюджет
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
  item: { title: string; icon: React.ComponentType<{ className?: string }>; href: string }
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
          'group/item relative overflow-hidden transition-all duration-200 h-9',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
        )}
      >
        <Link to={item.href}>
          <motion.div
            className="relative z-10 flex items-center gap-3"
            initial={false}
            whileHover={{ x: collapsed ? 0 : 2 }}
            transition={{ duration: 0.15 }}
          >
            <div className="relative">
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover/item:text-foreground'
                )}
              />
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -inset-2 rounded-lg bg-primary/10 blur-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'truncate text-[13px] transition-colors duration-200',
                    isActive ? 'font-medium' : 'font-normal'
                  )}
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Active indicator line */}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}

          {/* Hover highlight */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-sidebar-accent/50 to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100" />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavGroup({
  group,
  collapsed,
  activeHref,
}: {
  group: (typeof navGroups)[0]
  collapsed: boolean
  activeHref: string
}) {
  const GroupIcon = group.icon

  return (
    <SidebarGroup className="py-1.5">
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SidebarGroupLabel
              className="mb-1 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70"
            >
              <GroupIcon className="h-3 w-3" />
              {group.label}
            </SidebarGroupLabel>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={
                item.href === '/'
                  ? activeHref === '/'
                  : activeHref.startsWith(item.href)
              }
              collapsed={collapsed}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-gold/[0.01]" />

      {/* Top accent line */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <SidebarHeader className="relative border-b border-sidebar-border/30 px-3 py-3">
        <Logo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="relative px-2 py-2">
        {/* Staggered animation container */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
              },
            },
          }}
          className="space-y-1"
        >
          {navGroups.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <NavGroup
                group={group}
                collapsed={collapsed}
                activeHref={location.pathname}
              />

              {/* Separator between groups (except last) */}
              {groupIndex < navGroups.length - 1 && !collapsed && (
                <div className="mx-2 my-2 h-[1px] bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </SidebarContent>

      <SidebarFooter className="relative border-t border-sidebar-border/30 px-2 py-2">
        {/* Bottom accent */}
        <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-sidebar to-transparent pointer-events-none" />

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

        {/* Version badge */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-center justify-center"
            >
              <span className="text-[9px] font-medium tracking-wider text-muted-foreground/40">
                v{__APP_VERSION__}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Exchange rates widget */}
      <HeaderRates />

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
        {/* Глобальное уведомление о просроченных платежах */}
        <GlobalOverdueAlert />
      </div>
    </SidebarProvider>
  )
}
