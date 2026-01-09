"use client"

import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { Toaster } from "@/components/toaster"
import { ToastProvider } from "@/hooks/use-toast"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-full w-full bg-gradient-to-br from-background via-background to-muted/20 relative">
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        <Navigation />
        <div className="flex-1 flex flex-col lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto min-h-screen pt-16 lg:pt-16">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  )
}
