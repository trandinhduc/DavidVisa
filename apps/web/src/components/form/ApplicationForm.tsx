'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
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
      passportExpiryDate: null,
      portraitPhoto: null,
      passportPhoto: null,
    }
  })

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
      if (data.passportExpiryDate) {
        formData.append('passportExpiryDate', data.passportExpiryDate as string)
      }
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

      {/* Passport Expiry Date */}
      <Controller
        control={control}
        name="passportExpiryDate"
        render={({ field }) => (
          <DateInput
            id="passportExpiryDate"
            label={<span>Passport Expiry Date <span className="text-destructive ml-1">*</span></span>}
            value={field.value || null}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.passportExpiryDate?.message}
            aria-describedby={errors.passportExpiryDate ? 'passportExpiryDate-error' : undefined}
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
