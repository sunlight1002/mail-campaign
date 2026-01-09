import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Video, BarChart3, Upload } from "lucide-react"

export const metadata: Metadata = {
  title: "Home",
}

export default function Home() {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8">
        <div className="inline-block">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-fade-in !leading-normal">
            Real Estate Campaign Manager
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Multi-phase campaign system for personalized outreach to property owners
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="h-1 w-2 bg-primary rounded-full"></div>
          <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-slide-in flex flex-col h-full" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Voice Campaigns</CardTitle>
            </div>
            <CardDescription className="text-base">
              Create and send personalized ringless voicemail drops
            </CardDescription>
          </CardHeader>
          <CardContent className="relative mt-auto">
            <Link href="/pages/voice">
              <Button className="w-full group-hover:scale-105 transition-transform duration-300">
                Go to Voice Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-hover group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 animate-slide-in flex flex-col h-full" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Video Campaigns</CardTitle>
            </div>
            <CardDescription className="text-base">
              Generate and send personalized video emails
            </CardDescription>
          </CardHeader>
          <CardContent className="relative mt-auto">
            <Link href="/pages/video">
              <Button className="w-full group-hover:scale-105 transition-transform duration-300">
                Go to Video Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-hover group relative overflow-hidden border-2 border-dashed opacity-75 animate-slide-in flex flex-col h-full" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl text-muted-foreground">Analytics</CardTitle>
            </div>
            <CardDescription className="text-base">
              View campaign performance and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="relative mt-auto">
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover group relative overflow-hidden border-2 border-dashed opacity-75 animate-slide-in flex flex-col h-full" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl text-muted-foreground">Import Leads</CardTitle>
            </div>
            <CardDescription className="text-base">
              Upload CSV or Excel files with prospect data
            </CardDescription>
          </CardHeader>
          <CardContent className="relative mt-auto">
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

