export interface MrzResult {
  lastName: string
  firstName: string
}

/**
 * Parse một dòng MRZ Line 1 theo chuẩn ICAO 9303 TD3 (passport).
 * Format: P<{country}{surname}<<{given_names}<<<<<< (44 chars)
 * Ví dụ: P<VNMNGUYEN<<VAN<AN<<<<<<<<<<<<<<<<<<<<<<<<
 *   → lastName: "NGUYEN", firstName: "VAN AN"
 */
function parseMrzLine(line: string): MrzResult | null {
  // Bỏ whitespace OCR có thể thêm vào
  const clean = line.trim().replace(/\s/g, '')
  // OCR thường misread '<' thành 'P', nên chấp nhận cả 'PP' prefix; length check nới lỏng vì OCR có thể truncate
  if (!clean.startsWith('P<') && !clean.startsWith('PP')) return null
  if (clean.length < 20) return null

  // Positions 5-43: names field (bỏ P< + 3-char country code)
  const namesField = clean.substring(5, 44)
  const sepIdx = namesField.indexOf('<<')
  if (sepIdx === -1) return null

  const lastName = namesField.substring(0, sepIdx).replace(/</g, ' ').trim()
  const givenNamesRaw = namesField.substring(sepIdx + 2)
  const firstName = givenNamesRaw.split('<').filter(Boolean).join(' ').trim()

  if (!lastName) return null
  return { lastName, firstName }
}

/**
 * Tìm và parse MRZ từ text OCR trả về.
 * Tìm dòng bắt đầu bằng P< (hoặc PP — OCR error cho P<) trong toàn bộ text.
 */
export function parseMrzFromText(text: string): MrzResult | null {
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const result = parseMrzLine(line)
    if (result) return result
  }
  return null
}

/**
 * Gọi OCR.space API với URL ảnh passport, trả về MrzResult hoặc null.
 * Throws nếu OCR_SPACE_API_KEY chưa được set hoặc network error.
 */
export async function extractMrzFromPassport(imageUrl: string): Promise<MrzResult | null> {
  const apiKey = process.env.OCR_SPACE_API_KEY
  if (!apiKey) throw new Error('OCR_SPACE_API_KEY is not configured')

  const formData = new FormData()
  formData.append('url', imageUrl)
  formData.append('apikey', apiKey)
  formData.append('language', 'eng')
  formData.append('OCREngine', '2')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) throw new Error(`OCR.space API responded ${response.status}`)

  const data = await response.json()

  if (data.IsErroredOnProcessing || !data.ParsedResults?.[0]?.ParsedText) return null

  return parseMrzFromText(data.ParsedResults[0].ParsedText)
}
