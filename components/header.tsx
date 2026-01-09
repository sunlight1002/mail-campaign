"use client"

import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="hidden lg:flex fixed top-0 right-0 left-64 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 items-center justify-end px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}

