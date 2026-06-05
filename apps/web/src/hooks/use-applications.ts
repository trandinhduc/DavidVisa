import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { ApplicationData } from '@david-agency/shared'

export function useApplications() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map((item) => ({
        id: item.id,
        appId: item.app_id,
        lastName: item.last_name,
        firstName: item.first_name,
        email: item.email,
        arrivalDate: item.arrival_date,
        status: item.status,
        portraitPath: item.portrait_path,
        passportPath: item.passport_path,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as ApplicationData[]
    }
  })
}
