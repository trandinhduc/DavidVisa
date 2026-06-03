const APP_ID_REGEX = /^DA-\d{4}-\d{6,}$/

export function isValidAppId(appId: string): boolean {
  return APP_ID_REGEX.test(appId.trim())
}
