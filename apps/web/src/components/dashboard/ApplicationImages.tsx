'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useSignedUrls } from '@/hooks/use-application'
import { Skeleton } from '@/components/ui/skeleton'

interface ImageSlotProps {
  src: string | null | undefined
  alt: string
  isLoading: boolean
}

function ImageSlot({ src, alt, isLoading }: ImageSlotProps) {
  const [imgError, setImgError] = useState(false)

  if (isLoading) {
    return <Skeleton className="w-full aspect-[3/4] rounded-md" />
  }

  if (!src || imgError) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-[3/4] rounded-md border border-border bg-muted text-muted-foreground gap-2">
        <ImageOff className="h-8 w-8 opacity-40" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full aspect-[3/4] object-cover rounded-md border border-border"
      onError={() => setImgError(true)}
    />
  )
}

interface ApplicationImagesProps {
  applicationId: string
}

export function ApplicationImages({ applicationId }: ApplicationImagesProps) {
  const { data, isLoading } = useSignedUrls(applicationId)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Portrait Photo
        </p>
        <ImageSlot
          src={data?.portraitSignedUrl}
          alt="Portrait Photo"
          isLoading={isLoading}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Passport Photo
        </p>
        <ImageSlot
          src={data?.passportSignedUrl}
          alt="Passport Photo"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
