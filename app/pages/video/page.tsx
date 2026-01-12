"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, Send, FileText, Settings, Video, Rocket, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { parseProspectFile, type Prospect } from "@/lib/utils/file-parser"

export default function VideoCampaignPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [script, setScript] = useState(`Hi {firstName}, following up on the voicemail about your property at {propertyAddress}. I wanted to reach out personally because I have a client with an unsolicited offer and thought you might be interested in reviewing it. Please give me a call at {yourPhone} if you'd like to discuss. Thanks!`)
  const [yourName, setYourName] = useState("")
  const [yourPhone, setYourPhone] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTestingVideo, setIsTestingVideo] = useState(false)
  const [testVideoFile, setTestVideoFile] = useState<File | null>(null)
  const [testVideoFileName, setTestVideoFileName] = useState<string>("")
  const [testEmail, setTestEmail] = useState("")
  const [progress, setProgress] = useState(0)
  const [heygenScript, setHeygenScript] = useState("")
  const [isGeneratingHeygen, setIsGeneratingHeygen] = useState(false)
  const [heygenProgress, setHeygenProgress] = useState(0)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const STORAGE_KEY = "videoCampaignSettings"
  const TEST_VIDEO_STORAGE_KEY = "videoTestVideo"

  // Load settings from localStorage on mount
  useEffect(() => {
    document.title = "Video Campaigns | Campaign Manager"
    
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.yourName) setYourName(settings.yourName)
        if (settings.yourPhone) setYourPhone(settings.yourPhone)
        if (settings.script) setScript(settings.script)
      }
      
      // Load test video file name
      const savedTestVideo = localStorage.getItem(TEST_VIDEO_STORAGE_KEY)
      if (savedTestVideo) {
        const testVideo = JSON.parse(savedTestVideo)
        if (testVideo.fileName) setTestVideoFileName(testVideo.fileName)
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = {
        yourName,
        yourPhone,
        script,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error)
    }
  }, [yourName, yourPhone, script])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    try {
      const data = await parseProspectFile(file)
      
      if (data.length === 0) {
        toast({
          title: "No data found",
          description: "The file appears to be empty or doesn't contain valid prospect data",
          variant: "destructive",
        })
        return
      }
      
      setProspects(data)
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${data.length} prospects from ${file.name}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to parse file. Please ensure it's a valid CSV or XLSX file.",
        variant: "destructive",
      })
    }
  }

  const generatePersonalizedScript = (prospect: Prospect): string => {
    return script
      .replace(/{firstName}/g, prospect.firstName)
      .replace(/{yourName}/g, yourName)
      .replace(/{propertyAddress}/g, prospect.propertyAddress)
      .replace(/{yourPhone}/g, yourPhone)
  }

  const handlePreview = async (prospect: Prospect) => {
    if (!prospect) {
      const firstProspect = prospects[0]
      if (!firstProspect) {
        toast({
          title: "No prospects",
          description: "Please upload a prospect list first",
          variant: "destructive",
        })
        return
      }
      prospect = firstProspect
    }

    const personalizedScript = generatePersonalizedScript(prospect)
    
    try {
      setIsGenerating(true)
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: personalizedScript,
          prospect,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate video")

      const videoBlob = await response.blob()
      const videoUrl = URL.createObjectURL(videoBlob)
      window.open(videoUrl, "_blank")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTestVideoFileUpload = async (file: File) => {
    if (!file) return

    setTestVideoFile(file)
    setTestVideoFileName(file.name)

    // Save to localStorage
    try {
      localStorage.setItem(TEST_VIDEO_STORAGE_KEY, JSON.stringify({
        fileName: file.name,
        lastModified: file.lastModified,
      }))
    } catch (error) {
      console.error("Failed to save test video info:", error)
    }

    toast({
      title: "Video file selected",
      description: `${file.name} is ready for testing`,
    })
  }

  const handleRemoveTestVideo = () => {
    setTestVideoFile(null)
    setTestVideoFileName("")
    try {
      localStorage.removeItem(TEST_VIDEO_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to remove test video info:", error)
    }
  }

  const handleTestVideo = async () => {
    if (!testEmail) {
      toast({
        title: "Missing email",
        description: "Please enter an email address to test",
        variant: "destructive",
      })
      return
    }

    if (!testVideoFile) {
      toast({
        title: "No video file",
        description: "Please upload a video file to test",
        variant: "destructive",
      })
      return
    }

    setIsTestingVideo(true)

    try {
      // First, upload the file to get a URL
      const formData = new FormData()
      formData.append("file", testVideoFile)

      const uploadResponse = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video file")
      }

      const uploadResult = await uploadResponse.json()
      const videoUrl = uploadResult.url

      // Then send the test video email
      const response = await fetch("/api/video/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect: {
            firstName: "Test",
            email: testEmail,
            propertyAddress: "Test Address",
          },
          script: "This is a test video message",
          yourName: yourName || "Test User",
          yourPhone: yourPhone || "+1234567890",
          videoUrl: videoUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send test video")
      }

      toast({
        title: "Test video sent",
        description: `Test video (${testVideoFileName}) sent to ${testEmail}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test video",
        variant: "destructive",
      })
    } finally {
      setIsTestingVideo(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!yourName || !yourPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and phone number",
        variant: "destructive",
      })
      return
    }

    if (prospects.length === 0) {
      toast({
        title: "No prospects",
        description: "Please upload a prospect list first",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setProgress(0)

    try {
      for (let i = 0; i < prospects.length; i++) {
        const prospect = prospects[i]
        const personalizedScript = generatePersonalizedScript(prospect)

        const response = await fetch("/api/video/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospect,
            script: personalizedScript,
            yourName,
            yourPhone,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send to ${prospect.firstName}`)
        }

        setProgress(((i + 1) / prospects.length) * 100)
      }

      toast({
        title: "Campaign sent",
        description: `Successfully sent ${prospects.length} video emails`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-3 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent !leading-normal">
              Video Campaign Manager
            </h1>
          </div>
        </div>
      </div>

      <Tabs defaultValue="real" className="w-full">
        <TabsList className="flex flex-wrap w-auto max-w-auto bg-muted/50 p-1 rounded-lg justify-start gap-2">
          <TabsTrigger value="real" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Rocket className="h-4 w-4" />
            Real
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Video className="h-4 w-4" />
            Send Video Email Test
          </TabsTrigger>
          <TabsTrigger value="heygen" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Sparkles className="h-4 w-4" />
            Generate Clone Video
          </TabsTrigger>
          <TabsTrigger value="setting" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Settings className="h-4 w-4" />
            Setting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="real" className="space-y-6 mt-8">
          <Card className="card-hover border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Prospect List</CardTitle>
                  <CardDescription className="mt-1">Upload CSV or XLSX file with prospect data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDropzone
                onFileSelect={handleFileUpload}
                accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                label="CSV or XLSX File"
                description="Supported formats: CSV, XLSX, XLS. Required columns: First Name, Phone Number, Email, Property Address"
              />
              {prospects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Loaded: {prospects.length} prospects
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {prospects.slice(0, 10).map((p, i) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded">
                        {p.firstName} - {p.email}
                      </div>
                    ))}
                    {prospects.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {prospects.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isSending && (
            <Card className="border-2 border-primary/20 bg-primary/5 animate-fade-in">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sending video emails...</span>
                    <span className="text-primary font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="card-hover border-2">
            <CardHeader>
              <CardTitle className="text-xl">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={() => handlePreview(prospects[0])}
                disabled={isGenerating || prospects.length === 0}
                variant="outline"
                className="flex-1 hover:scale-105 transition-transform"
              >
                <Play className="h-4 w-4 mr-2" />
                Preview Video
              </Button>
              <Button
                onClick={handleSendCampaign}
                disabled={isSending || prospects.length === 0 || !yourName || !yourPhone}
                className="flex-1 hover:scale-105 transition-transform"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : `Send to ${prospects.length} Prospects`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6 mt-8">
          <Card className="card-hover border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Test Video Email</CardTitle>
                  <CardDescription className="mt-1">Upload a video file and send it as a test email</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <FileDropzone
                onFileSelect={handleTestVideoFileUpload}
                accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
                label="Test Video File"
                description="Upload a video file (mp4, webm, mov, avi, mkv) to test video email delivery"
                selectedFileName={testVideoFileName}
                onRemove={handleRemoveTestVideo}
              />
              <Button
                onClick={handleTestVideo}
                disabled={isTestingVideo || !testEmail || !testVideoFile}
                className="w-full"
              >
                <Video className="h-4 w-4 mr-2" />
                {isTestingVideo ? "Sending..." : "Send Test Video Email"}
              </Button>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  <strong>Test Video:</strong> Upload a video file and send it as an email to test video email delivery.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heygen" className="space-y-6 mt-8">
          <Card className="card-hover border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">HeyGen Video Clone</CardTitle>
                  <CardDescription className="mt-1">Generate AI video clone using HeyGen</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heygenScript">Script Text</Label>
                <Textarea
                  id="heygenScript"
                  placeholder="Enter the text you want the AI clone to say..."
                  value={heygenScript}
                  onChange={(e) => setHeygenScript(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the text that will be spoken by the AI video clone. The video will be generated using your configured HeyGen avatar and voice.
                </p>
              </div>

              {isGeneratingHeygen && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Generating video...</span>
                    <span className="text-primary font-semibold">{Math.round(heygenProgress)}%</span>
                  </div>
                  <Progress value={heygenProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    This may take a few minutes. Please wait...
                  </p>
                </div>
              )}

              {generatedVideoUrl && !isGeneratingHeygen && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <p className="font-medium">Video Generated Successfully!</p>
                      <video 
                        src={generatedVideoUrl} 
                        controls 
                        className="w-full rounded-lg"
                        style={{ maxHeight: "400px" }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(generatedVideoUrl, "_blank")}
                          variant="outline"
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button
                          onClick={() => {
                            setGeneratedVideoUrl(null)
                            setHeygenProgress(0)
                          }}
                          variant="outline"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={async () => {
                  if (!heygenScript.trim()) {
                    toast({
                      title: "Missing script",
                      description: "Please enter text for the video clone",
                      variant: "destructive",
                    })
                    return
                  }

                  setIsGeneratingHeygen(true)
                  setHeygenProgress(0)
                  setGeneratedVideoUrl(null)

                  try {
                    // Simulate progress updates
                    const progressInterval = setInterval(() => {
                      setHeygenProgress((prev) => {
                        if (prev >= 90) return prev
                        return prev + 10
                      })
                    }, 2000)

                    const response = await fetch("/api/video/heygen-clone", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        text: heygenScript,
                      }),
                    })

                    clearInterval(progressInterval)
                    setHeygenProgress(100)

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || "Failed to generate video")
                    }

                    const result = await response.json()
                    setGeneratedVideoUrl(result.videoUrl)

                    toast({
                      title: "Video generated",
                      description: "Your HeyGen clone video has been generated successfully!",
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to generate video",
                      variant: "destructive",
                    })
                  } finally {
                    setIsGeneratingHeygen(false)
                  }
                }}
                disabled={isGeneratingHeygen || !heygenScript.trim()}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingHeygen ? "Generating Video..." : "Generate Video Clone"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setting" className="space-y-6 mt-8">
          <Card className="card-hover border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Campaign Settings</CardTitle>
                  <CardDescription className="mt-1">Configure your video email campaign</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  placeholder="John Doe"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yourPhone">Your Phone Number</Label>
                <Input
                  id="yourPhone"
                  placeholder="+1234567890"
                  value={yourPhone}
                  onChange={(e) => setYourPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script">Video Script</Label>
                <Textarea
                  id="script"
                  placeholder="Enter your script template..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{firstName}"}, {"{yourName}"}, {"{propertyAddress}"}, {"{yourPhone}"} as placeholders
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
