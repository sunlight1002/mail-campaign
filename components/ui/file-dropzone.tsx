"use client"

import React, { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in bytes
  className?: string
  label?: string
  description?: string
  selectedFileName?: string
  onRemove?: () => void
}

export function FileDropzone({
  onFileSelect,
  accept,
  maxSize,
  className,
  label,
  description,
  selectedFileName,
  onRemove,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>("")

  const validateFile = (file: File): boolean => {
    setError("")
    
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB`)
      return false
    }

    if (accept) {
      const acceptedTypes = accept.split(",").map(type => type.trim())
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      const fileType = file.type

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          return fileExtension === type.toLowerCase()
        }
        if (type.includes("/*")) {
          const baseType = type.split("/")[0]
          return fileType.startsWith(baseType + "/")
        }
        return fileType === type || fileExtension === type.toLowerCase()
      })

      if (!isAccepted) {
        setError(`File type not supported. Accepted: ${accept}`)
        return false
      }
    }

    return true
  }

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file)
        setError("")
      }
    },
    [onFileSelect, accept, maxSize]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          selectedFileName && "border-primary/50 bg-primary/5"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {selectedFileName ? (
            <>
              <div className="flex items-center gap-2 w-full justify-center">
                <Upload className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {selectedFileName}
                </span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove()
                    }}
                    className="ml-2 p-1 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click or drag to replace file
              </p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

