import 'server-only'

type RecaptchaResponse = {
  success: boolean
  score?: number
}

export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    throw new Error('RECAPTCHA_SECRET_KEY is not configured')
  }
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }).toString(),
  })
  const data = (await response.json()) as RecaptchaResponse
  // reCAPTCHA v3 also returns a score; require >= 0.5 to pass
  if (data.score !== undefined) {
    return data.success && data.score >= 0.5
  }
  return data.success
}
