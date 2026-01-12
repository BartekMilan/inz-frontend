"use client"

import { useState, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu, Users, Contact, UserPlus, Settings, LogOut, User, Hexagon, FolderKanban, Home } from "lucide-react"
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
import { useAuth } from "@/contexts/AuthContext"
import { useLogout } from "@/hooks/use-auth"
import { Role } from "@/lib/roles"
import ProjectSwitcher from "@/components/ProjectSwitcher"
import { useProject } from "@/contexts/ProjectContext"
import { useProjectPermissions } from "@/hooks/use-project-permissions"

// Navigation items with role-based access
// projectRoles: array of project roles that can access this item (empty = all users)
// systemRoles: array of system roles that can access this item (empty = all users)
// requiresAdminOrOwner: if true, item is visible for ADMIN (system) OR OWNER (project)
const navigationItems = [
  { 
    label: "Dashboard", 
    icon: Home, 
    href: "/dashboard", 
    projectRoles: [], // Wszyscy mogą zobaczyć dashboard
    systemRoles: []
  },
  { 
    label: "Uczestnicy", 
    icon: Contact, 
    href: "/participants", 
    projectRoles: [], // Wszyscy mogą zobaczyć uczestników
    systemRoles: []
  },
  { 
    label: "Zespół", 
    icon: Users, 
    href: "/users", 
    requiresAdminOrOwner: true // ADMIN (systemowy) LUB OWNER (projektowy) LUB EDITOR (projektowy)
  },
  { 
    label: "Ustawienia", 
    icon: Settings, 
    href: "/settings", 
    requiresAdminOrOwner: true // ADMIN (systemowy) LUB OWNER (projektowy)
  },
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

function SidebarContent({ activeRoute, onNavigate, filteredNavItems, isAdmin, selectedProject }) {
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

      {/* Project Switcher (Admin only) or Project Name (Registrar) */}
      {isAdmin ? (
        <ProjectSwitcher className="pt-4" />
      ) : selectedProject ? (
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedProject.name}</p>
              <p className="text-xs text-muted-foreground">Twój projekt</p>
            </div>
          </div>
        </div>
      ) : null}

      <Separator className="bg-border/40 mx-3" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavItems.map((item) => (
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
  const { user, userRole, checkRole } = useAuth()
  const { isAdmin, selectedProject } = useProject()
  const { canManageProject, role: projectRole } = useProjectPermissions()
  const logoutMutation = useLogout()

  const activeRoute = location.pathname
  const isActive = (path) => location.pathname.startsWith(path)

  // Filter navigation items based on user role (system and project roles)
  const filteredNavItems = useMemo(() => {
    return navigationItems.filter((item) => {
      // Special case: requiresAdminOrOwner - dostęp dla ADMIN (systemowy) LUB OWNER/EDITOR (projektowy)
      if (item.requiresAdminOrOwner) {
        return isAdmin || projectRole === 'owner' || projectRole === 'editor';
      }
      
      // Check project role requirements
      if (item.projectRoles && item.projectRoles.length > 0) {
        if (!projectRole || !item.projectRoles.includes(projectRole)) {
          return false;
        }
      }
      
      // Check system role requirements
      if (item.systemRoles && item.systemRoles.length > 0) {
        if (!checkRole(item.systemRoles)) {
          return false;
        }
      }
      
      // If no restrictions, allow all authenticated users
      return true;
    });
  }, [checkRole, projectRole, isAdmin]);

  const handleNavigate = (href) => {
    navigate(href)
    setMobileOpen(false)
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Get breadcrumb text based on current route
  const getBreadcrumb = () => {
    const route = filteredNavItems.find((item) => isActive(item.href))
    return route ? route.label : "Dashboard"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border">
        <SidebarContent activeRoute={activeRoute} onNavigate={handleNavigate} filteredNavItems={filteredNavItems} isAdmin={isAdmin} selectedProject={selectedProject} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-border">
          <SidebarContent activeRoute={activeRoute} onNavigate={handleNavigate} filteredNavItems={filteredNavItems} isAdmin={isAdmin} selectedProject={selectedProject} />
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
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
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
