import { z } from 'zod'

export const applicationFormSchema = z.object({
  lastName: z.string().trim().min(1, 'Last name is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  portraitPhoto: z
    .instanceof(File)
    .nullable()
    .refine((f) => f !== null, { message: 'Portrait photo is required' }),
  passportPhoto: z
    .instanceof(File)
    .nullable()
    .refine((f) => f !== null, { message: 'Passport photo is required' }),
  arrivalDate: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.length > 0, {
      message: 'Date of Arrival is required',
    })
    .refine((val) => {
      if (!val) return false
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return false
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      if (month < 1 || month > 12) return false
      const date = new Date(year, month - 1, day)
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    }, { message: 'Please enter a valid date in DD/MM/YYYY format.' })
    .refine((val) => {
      if (!val) return false
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return false
      const date = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    }, { message: 'Arrival date cannot be in the past.' }),
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>
