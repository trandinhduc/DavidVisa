import { useQuery } from '@tanstack/react-query'
import type { ApplicationData } from '@david-agency/shared'

export function useApplication(id: string) {
  return useQuery<ApplicationData>({
    queryKey: ['applications', id],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch application: ${res.statusText}`)
      }
      const { data, error } = await res.json()
      if (error) throw new Error(error.message)
      return data as ApplicationData
    },
    enabled: !!id,
  })
}

export function useSignedUrls(id: string) {
  return useQuery<{ portraitSignedUrl: string | null; passportSignedUrl: string | null }>({
    queryKey: ['applications', id, 'signed-urls'],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}/signed-urls`)
      if (!res.ok) {
        throw new Error(`Failed to fetch signed URLs: ${res.statusText}`)
      }
      const { data, error } = await res.json()
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes (signed URLs expire after 1 hour)
  })
}
