'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { convertHeicToJpg } from '@/lib/heic-convert'

interface ImageUploadProps {
  id?: string
  value: File | null
  onChange: (file: File | null) => void
  error?: string
  label: string
  'aria-describedby'?: string
}

const MAX_FILE_SIZE = 6 * 1024 * 1024 // 6MB

export function ImageUpload({ value, onChange, error, label, id, 'aria-describedby': ariaDescribedby }: ImageUploadProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  // Clear local error when error prop is cleared
  useEffect(() => {
    if (!error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalError(null)
    }
  }, [error])

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setLocalError(null)

    if (fileRejections.length > 0) {
      const rejection = fileRejections[0]
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setLocalError('This file is too large. Maximum size is 6MB.')
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setLocalError('Invalid file type. Only JPG, PNG, and HEIC are allowed.')
      } else {
        setLocalError(rejection.errors[0].message)
      }
      return
    }

    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsConverting(true)
    try {
      const processedFile = await convertHeicToJpg(file)
      onChange(processedFile)
    } catch {
      setLocalError('Failed to process image. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif']
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: isConverting
  })

  const handleRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onChange(null)
    setLocalError(null)
  }

  const handleRemoveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRemove(e)
    }
  }

  const errorMessage = error || localError
  const hasError = !!errorMessage

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      
      {value ? (
        <div className={cn("relative min-h-[240px] rounded-lg border-2 border-border overflow-hidden", hasError && "border-destructive")}>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={`${label} preview`} className="w-full max-h-[320px] object-contain bg-muted/20" />
          )}
          <button
            type="button"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background p-1.5 rounded-md shadow-sm backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleRemove}
            onKeyDown={handleRemoveKeyDown}
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
          
          <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm p-2 text-xs truncate border-t border-border">
            <span className="font-medium text-foreground">{value.name}</span>
            <span className="text-muted-foreground ml-2">{(value.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          id={id}
          className={cn(
            "flex flex-col items-center justify-center min-h-[240px] p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragActive ? "border-accent bg-muted" : "border-border hover:bg-muted/50",
            hasError && "border-destructive",
            isConverting && "cursor-not-allowed opacity-70"
          )}
          role="button"
          aria-label={`Upload ${label}`}
          aria-describedby={ariaDescribedby}
        >
          <input {...getInputProps()} />
          
          {isConverting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <UploadCloud className={cn("h-8 w-8 text-muted-foreground", isDragActive && "text-accent")} />
              <p className="text-sm font-medium text-foreground">
                Drag &amp; drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, HEIC — max 6MB
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p id={ariaDescribedby ?? (id ? `${id}-error` : undefined)} role="alert" className="text-xs text-destructive mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
