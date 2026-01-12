"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, Send, FileText, Settings, MessageSquare, Rocket, Mic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parseProspectFile, type Prospect } from "@/lib/utils/file-parser"
import { FileDropzone } from "@/components/ui/file-dropzone"

export default function VoiceCampaignPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [script, setScript] = useState(`Hi {firstName}, this is {yourName}. I have a client with an unsolicited offer on your property at {propertyAddress} and wanted to gauge your interest in reviewing it. Please give me a call at {yourPhone} if you're open to discussing. Thanks!`)
  const [yourName, setYourName] = useState("")
  const [yourPhone, setYourPhone] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState("default")
  const [testPhoneNumber, setTestPhoneNumber] = useState("")
  const [testAudioFile, setTestAudioFile] = useState<File | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const STORAGE_KEY = "voiceCampaignSettings"

  // Load settings from localStorage on mount
  useEffect(() => {
    document.title = "Voice Campaigns | Campaign Manager"
    
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.yourName) setYourName(settings.yourName)
        if (settings.yourPhone) setYourPhone(settings.yourPhone)
        if (settings.script) setScript(settings.script)
        if (settings.selectedVoice) setSelectedVoice(settings.selectedVoice)
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
        selectedVoice,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error)
    }
  }, [yourName, yourPhone, script, selectedVoice])

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
      const response = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: personalizedScript,
          voiceId: selectedVoice === "default" ? undefined : selectedVoice,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate voice")

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
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

        const response = await fetch("/api/voice/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospect,
            script: personalizedScript,
            yourName,
            yourPhone,
            voiceId: selectedVoice === "default" ? undefined : selectedVoice,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send to ${prospect.firstName}`)
        }

        setProgress(((i + 1) / prospects.length) * 100)
      }

      toast({
        title: "Campaign sent",
        description: `Successfully sent ${prospects.length} voicemails`,
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

  const handleTestAudioUpload = (file: File) => {
    setTestAudioFile(file)
  }

  const handleTestVoicemail = async () => {
    if (!testPhoneNumber || !testAudioFile) {
      toast({
        title: "Missing information",
        description: "Please provide both phone number and audio file",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)

    try {
      // First, upload the audio file
      const formData = new FormData()
      formData.append("file", testAudioFile)

      const uploadResponse = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload audio file")
      }

      const { url: audioUrl } = await uploadResponse.json()

      // Then, send the voicemail
      const sendResponse = await fetch("/api/voice/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          audioUrl,
        }),
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || "Failed to send test voicemail")
      }

      const result = await sendResponse.json()

      toast({
        title: "Test voicemail sent",
        description: `Voicemail sent to ${testPhoneNumber}. Call SID: ${result.callSid}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test voicemail",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-3 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent !leading-normal">
              Voice Campaign Manager
            </h1>
          </div>
        </div>
      </div>

      <Tabs defaultValue="real" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="real" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Rocket className="h-4 w-4" />
            Real
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <MessageSquare className="h-4 w-4" />
            Test
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
                        {p.firstName} - {p.phoneNumber}
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
                    <span className="font-medium">Sending voicemails...</span>
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
                Preview Voice
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
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Test Voicemail</CardTitle>
                  <CardDescription className="mt-1">Upload an audio file and send a test voicemail to a phone number</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhoneNumber">Phone Number</Label>
                <Input
                  id="testPhoneNumber"
                  placeholder="+1234567890"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number in E.164 format (e.g., +1234567890)
                </p>
              </div>
              <div className="space-y-2">
                <FileDropzone
                  onFileSelect={handleTestAudioUpload}
                  accept="audio/*,.mp3,.wav,.m4a"
                  label="Audio File"
                  description="Upload an audio file (MP3, WAV, M4A)"
                  selectedFileName={testAudioFile?.name}
                  onRemove={() => setTestAudioFile(null)}
                />
              </div>
              <Button
                onClick={handleTestVoicemail}
                disabled={!testPhoneNumber || !testAudioFile || isTesting}
                className="w-full hover:scale-105 transition-transform"
              >
                <Send className="h-4 w-4 mr-2" />
                {isTesting ? "Sending Test Voicemail..." : "Test Voicemail"}
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
                  <CardDescription className="mt-1">Configure your voicemail campaign</CardDescription>
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
                <Label htmlFor="voice">Voice Selection</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Voice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="script">Voicemail Script</Label>
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
