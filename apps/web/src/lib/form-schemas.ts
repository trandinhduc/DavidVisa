import { z } from 'zod'

export const applicationFormSchema = z.object({
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  email: z.string().optional(),
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
      today.setHours(0, 0, 0, 0)
      return date >= today
    }, { message: 'Arrival date cannot be in the past.' }),
  religion: z.string().optional(),
  placeOfBirth: z.string().optional(),
  visaValidFrom: z.string().optional(),
  passportType: z.string().optional(),
  passportExpiryDate: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.length > 0, {
      message: 'Passport Expiry Date is required',
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
    }, { message: 'Passport Expiry Date cannot be in the past.' }),
  passportIssueDate: z.string().optional(),
  permanentAddress: z.string().optional(),
  contactAddress: z.string().optional(),
  telephone: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyAddress: z.string().optional(),
  emergencyTelephone: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  purposeOfEntry: z.string().optional(),
  intendedDateOfEntry: z.string().optional(),
  intendedLengthOfStay: z.string().optional(),
  residentialAddressInVietnam: z.string().optional(),
  provinceCity: z.string().optional(),
  wardCommune: z.string().optional(),
  entryGate: z.string().optional(),
  exitGate: z.string().optional(),
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>
