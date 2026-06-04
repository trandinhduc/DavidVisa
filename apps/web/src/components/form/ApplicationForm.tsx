'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { applicationFormSchema, type ApplicationFormData } from '@/lib/form-schemas'
import { ImageUpload } from '@/components/form/ImageUpload'
import { DateInput } from '@/components/form/DateInput'

export default function ApplicationForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    mode: 'onBlur',
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      arrivalDate: null,
      portraitPhoto: null,
      passportPhoto: null,
    }
  })

  // Story 2.5 sẽ thay () => {} bằng async submit handler gọi POST /api/applications
  return (
    <form noValidate onSubmit={handleSubmit(() => {})} className="flex flex-col gap-6">
      {/* Last Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lastName">Last Name (Family Name)</Label>
        <Input
          id="lastName"
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          className={cn(errors.lastName && 'border-destructive')}
          {...register('lastName')}
        />
        {errors.lastName && (
          <p id="lastName-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* First Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="firstName">First Name (Given Name)</Label>
        <Input
          id="firstName"
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          className={cn(errors.firstName && 'border-destructive')}
          {...register('firstName')}
        />
        {errors.firstName && (
          <p id="firstName-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Email Address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={cn(errors.email && 'border-destructive')}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Arrival Date */}
      <Controller
        control={control}
        name="arrivalDate"
        render={({ field }) => (
          <DateInput
            id="arrivalDate"
            label="Date of Arrival"
            value={field.value || null}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.arrivalDate?.message}
            aria-describedby={errors.arrivalDate ? 'arrivalDate-error' : undefined}
          />
        )}
      />

      {/* Portrait Photo */}
      <Controller
        control={control}
        name="portraitPhoto"
        render={({ field }) => (
          <ImageUpload
            id="portraitPhoto"
            label="Portrait Photo"
            value={field.value || null}
            onChange={field.onChange}
            error={errors.portraitPhoto?.message}
            aria-describedby={errors.portraitPhoto ? 'portraitPhoto-error' : undefined}
          />
        )}
      />

      {/* Passport Photo */}
      <Controller
        control={control}
        name="passportPhoto"
        render={({ field }) => (
          <ImageUpload
            id="passportPhoto"
            label="Passport Photo"
            value={field.value || null}
            onChange={field.onChange}
            error={errors.passportPhoto?.message}
            aria-describedby={errors.passportPhoto ? 'passportPhoto-error' : undefined}
          />
        )}
      />
    </form>
  )
}
