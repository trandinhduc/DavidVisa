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
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>
