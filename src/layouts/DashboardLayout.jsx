"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu, Users, Contact, UserPlus, Settings, LogOut, User, Hexagon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

const navigationItems = [
  { label: "Zespół", icon: Users, href: "/users" },
  { label: "Uczestnicy", icon: Contact, href: "/participants" },
  { label: "Dodaj uczestnika", icon: UserPlus, href: "/participants/new" },
  { label: "Ustawienia", icon: Settings, href: "/settings" },
]

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onClick(item.href)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group",
        isActive
          ? "bg-background text-foreground font-medium shadow-sm"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-foreground")} />
      <span className="text-sm">{item.label}</span>
    </button>
  )
}

function SidebarContent({ activeRoute, onNavigate }) {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      {/* Branding */}
      <div className="px-6 py-5 flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background">
          <Hexagon className="h-4.5 w-4.5 fill-current" />
        </div>
        <h2 className="text-base font-bold tracking-tight">EventSync</h2>
      </div>

      <Separator className="bg-border/40" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => (
          <NavItem key={item.href} item={item} isActive={activeRoute === item.href} onClick={onNavigate} />
        ))}
      </nav>
    </div>
  )
}

function DashboardLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeRoute = location.pathname
  const isActive = (path) => location.pathname.startsWith(path)

  const handleNavigate = (href) => {
    navigate(href)
    setMobileOpen(false)
  }

  // Get breadcrumb text based on current route
  const getBreadcrumb = () => {
    const route = navigationItems.find((item) => isActive(item.href))
    return route ? route.label : "Dashboard"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border">
        <SidebarContent activeRoute={activeRoute} onNavigate={handleNavigate} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-border">
          <SidebarContent activeRoute={activeRoute} onNavigate={handleNavigate} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header with Glassmorphism */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumbs */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-sm">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">{getBreadcrumb()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile - Just show current page */}
          <div className="md:hidden">
            <h1 className="text-sm font-semibold">{getBreadcrumb()}</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">AD</AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Wyloguj</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content - Generous Padding */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
