"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Mic, Video, Home, Menu, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navGroups = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Home", icon: Home },
      ],
    },
    {
      title: "Campaigns",
      items: [
        { href: "/pages/voice", label: "Voice Campaigns", icon: Mic },
        { href: "/pages/video", label: "Video Campaigns", icon: Video },
      ],
    },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16 flex items-center justify-between px-4 shadow-lg">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <Logo className="h-8 w-8 group-hover:scale-110 transition-transform" color="white" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Campaign Manager</h1>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-gradient-to-b from-background via-background to-muted/30 backdrop-blur-sm transition-transform duration-300 ease-in-out shadow-xl",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand Section */}
          <div className="flex h-16 items-center justify-between border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 backdrop-blur-sm">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Logo className="h-8 w-8 group-hover:scale-110 transition-transform" color="white" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Campaign</h1>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Menu with Groups */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-10 transition-all duration-200",
                            isActive && "bg-primary text-primary-foreground shadow-md hover:shadow-lg",
                            !isActive && "hover:bg-muted/50 hover:translate-x-1"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer section */}
          <div className="border-t bg-muted/30 p-4 backdrop-blur-sm space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Real Estate Campaign System
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
