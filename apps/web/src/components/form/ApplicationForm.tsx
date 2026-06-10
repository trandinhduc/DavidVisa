'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import ReCAPTCHA from 'react-google-recaptcha'
import { toast } from 'sonner'
import { LoaderCircle, Lock } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { applicationFormSchema, type ApplicationFormData } from '@/lib/form-schemas'
import { ImageUpload } from '@/components/form/ImageUpload'
import { DateInput } from '@/components/form/DateInput'

function computeVisaEndDate(arrivalDate: string | null, durationStr: string | null): string | null {
  if (!arrivalDate || !durationStr) return null
  const match = arrivalDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10))
  d.setDate(d.getDate() + parseInt(durationStr, 10))
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export default function ApplicationForm() {
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useV2Fallback, setUseV2Fallback] = useState(false)
  const [v2Token, setV2Token] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      arrivalDate: null,
      passportIssueDate: null,
      portraitPhoto: null,
      passportPhoto: null,
      registrationDuration: null,
      entryType: null,
    }
  })

  const watchedArrivalDate = useWatch({ control, name: 'arrivalDate' })
  const watchedDuration = useWatch({ control, name: 'registrationDuration' })

  const onSubmit = async (data: ApplicationFormData) => {
    let token: string | null = null
    
    if (useV2Fallback) {
      if (!v2Token) {
        toast.error('Please complete the reCAPTCHA challenge.')
        return
      }
      token = v2Token
    } else {
      if (!executeRecaptcha) {
        toast.error('Security check not ready. Please wait a moment and try again.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      // 1. Get reCAPTCHA token
      if (!useV2Fallback) {
        token = await executeRecaptcha!('submit_application')
        if (!token) {
          setUseV2Fallback(true)
          toast.error('Security check requires additional verification. Please complete the reCAPTCHA below.')
          setIsSubmitting(false)
          return
        }
      }

      // 2. Prepare FormData
      const formData = new FormData()
      if (data.lastName) formData.append('lastName', data.lastName)
      if (data.firstName) formData.append('firstName', data.firstName)
      if (data.email) formData.append('email', data.email)
      formData.append('arrivalDate', data.arrivalDate as string)
      if (data.passportIssueDate) {
        formData.append('passportIssueDate', data.passportIssueDate as string)
      }
      if (data.registrationDuration) formData.append('registrationDuration', data.registrationDuration)
      if (data.entryType) formData.append('entryType', data.entryType)
      formData.append('portraitPhoto', data.portraitPhoto as File)
      formData.append('passportPhoto', data.passportPhoto as File)
      formData.append('recaptchaToken', token!)

      // 3. Submit
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      })

      let result
      try {
        result = await response.json()
      } catch {
        throw new Error('Submission failed due to a network error. Please try again.')
      }

      if (!response.ok) {
        throw new Error(result.error?.message || 'Submission failed')
      }

      // 4. Redirect to success page
      router.push(`/success?id=${result.data.appId}`)
    } catch (error) {
      console.error('Submission error:', error)
      const message = error instanceof Error ? error.message : 'Submission failed — please try again.'
      toast.error(message, { duration: Infinity })
      setIsSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* First/Last name removed as per requirement */}

      {/* Email Address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="e.g. carlos@email.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={cn("h-11", errors.email && 'border-destructive')}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Registration Duration */}
      <Controller
        control={control}
        name="registrationDuration"
        render={({ field }) => {
          const endDate = computeVisaEndDate(watchedArrivalDate, field.value)
          return (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registrationDuration">Registration Duration</Label>
              <select
                id="registrationDuration"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                onBlur={field.onBlur}
                className={cn(
                  "h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  errors.registrationDuration && 'border-destructive'
                )}
              >
                <option value="">Select duration…</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              {endDate && (
                <p className="text-xs text-muted-foreground">
                  Visa valid until: <span className="font-medium text-foreground">{endDate}</span>
                </p>
              )}
              {errors.registrationDuration && (
                <p role="alert" className="text-xs text-destructive mt-1">
                  {errors.registrationDuration.message}
                </p>
              )}
            </div>
          )
        }}
      />

      {/* Entry Type */}
      <Controller
        control={control}
        name="entryType"
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <Label>Entry Type</Label>
            <div className="flex gap-4">
              {(['single', 'multiple'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer rounded-md border px-4 py-2.5 text-sm transition-colors",
                    field.value === type
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-input hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    checked={field.value === type}
                    onChange={() => field.onChange(type)}
                    onBlur={field.onBlur}
                    className="sr-only"
                  />
                  {type === 'single' ? 'Single-entry' : 'Multiple-entry'}
                </label>
              ))}
            </div>
            {errors.entryType && (
              <p role="alert" className="text-xs text-destructive">
                {errors.entryType.message}
              </p>
            )}
          </div>
        )}
      />

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

      {/* Passport Issue Date */}
      <Controller
        control={control}
        name="passportIssueDate"
        render={({ field }) => (
          <DateInput
            id="passportIssueDate"
            label={<span>Passport Issue Date <span className="text-destructive ml-1">*</span></span>}
            value={field.value || null}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.passportIssueDate?.message}
            aria-describedby={errors.passportIssueDate ? 'passportIssueDate-error' : undefined}
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
      {/* reCAPTCHA v2 Fallback */}
      {useV2Fallback && (
        <div className="flex justify-center">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'dummy_key'}
            onChange={(token) => setV2Token(token)}
            onExpired={() => setV2Token(null)}
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-[15px]" 
          disabled={isSubmitting || (!useV2Fallback && !executeRecaptcha)}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
          <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
          Your information is encrypted and stored securely. We will contact you via email once your application is received.
        </p>
      </div>
    </form>
  )
}
