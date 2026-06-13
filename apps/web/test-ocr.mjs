#!/usr/bin/env node
/**
 * Test OCR passport MRZ extraction locally.
 * Usage:  node apps/web/test-ocr.mjs <passport-image-url>
 * Reads OCR_SPACE_API_KEY from apps/web/.env.local automatically.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// --- Load .env.local ---
const envPath = resolve(import.meta.dirname, '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2].trim()
}

const apiKey = process.env.OCR_SPACE_API_KEY
if (!apiKey) {
  console.error('❌  OCR_SPACE_API_KEY not set in apps/web/.env.local')
  process.exit(1)
}

const imageUrl = process.argv[2]
if (!imageUrl) {
  console.error('Usage: node apps/web/test-ocr.mjs <passport-image-url>')
  process.exit(1)
}

// --- MRZ parser (mirrors ocr-passport.ts exactly) ---
function parseMrzLine(line) {
  const clean = line.trim().replace(/\s/g, '')
  // '<' sau 'P' thường bị OCR misread thành 'P', 'S', 'K'... nên chỉ yêu cầu: P + 1 ký tự + 3-char country code
  if (!/^P.[A-Z]{3}/.test(clean)) return null
  if (clean.length < 20) return null

  const namesField = clean.substring(5, 44)
  const sepIdx = namesField.indexOf('<<')
  if (sepIdx === -1) return null

  const lastName = namesField.substring(0, sepIdx).replace(/</g, ' ').trim()
  const givenNamesRaw = namesField.substring(sepIdx + 2)
  const firstName = givenNamesRaw.split('<').filter(Boolean).join(' ').trim()
  if (!lastName) return null
  return { lastName, firstName }
}

function parseMrzFromText(text) {
  for (const line of text.split(/\r?\n/)) {
    const result = parseMrzLine(line)
    if (result) return result
  }
  return null
}

// --- OCR.space call ---
console.log('🔍  Calling OCR.space...')
console.log('   URL:', imageUrl.substring(0, 80) + '...')

const formData = new FormData()
formData.append('url', imageUrl)
formData.append('apikey', apiKey)
formData.append('language', 'eng')
formData.append('OCREngine', '2')
formData.append('detectOrientation', 'true')
formData.append('scale', 'true')

const response = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData })

if (!response.ok) {
  console.error('❌  HTTP error from OCR.space:', response.status)
  process.exit(1)
}

const data = await response.json()

if (data.IsErroredOnProcessing) {
  console.error('❌  OCR.space error:', data.ErrorMessage)
  process.exit(1)
}

const parsedText = data.ParsedResults?.[0]?.ParsedText
if (!parsedText) {
  console.error('❌  No text returned from OCR.space')
  process.exit(1)
}

console.log('\n📄  Raw OCR text:')
console.log('─'.repeat(60))
console.log(parsedText)
console.log('─'.repeat(60))

// Show which lines match MRZ pattern and why
console.log('\n🔎  MRZ candidate lines (match P + any char + 3-letter country):')
let foundCandidate = false
for (const line of parsedText.split(/\r?\n/)) {
  const clean = line.trim().replace(/\s/g, '')
  if (/^P.[A-Z]{3}/.test(clean) && clean.length >= 20) {
    foundCandidate = true
    const namesField = clean.substring(5, 44)
    const sepIdx = namesField.indexOf('<<')
    const hasSep = sepIdx !== -1
    const diagnosis = hasSep
      ? `✅  separator '<<' at names[${sepIdx}]`
      : `⚠️   no '<<' separator — OCR likely misread '<' chars in separator positions`
    console.log(`  Line: ${JSON.stringify(clean)}`)
    console.log(`        ${diagnosis}`)
    if (hasSep) {
      const lastName = namesField.substring(0, sepIdx).replace(/</g, ' ').trim()
      const firstName = namesField.substring(sepIdx + 2).split('<').filter(Boolean).join(' ').trim()
      console.log(`        → lastName="${lastName}", firstName="${firstName}"`)
    } else {
      console.log(`        namesField: ${JSON.stringify(namesField)}`)
      console.log(`        Expected:   "SURNAME<<GIVENNAME<<<<..."`)
    }
  }
}
if (!foundCandidate) {
  console.log('  (none found — passport image may not show the MRZ zone at the bottom)')
}

// Final parse result
const mrz = parseMrzFromText(parsedText)
console.log()
if (mrz) {
  console.log('✅  Result:')
  console.log(`   lastName  = "${mrz.lastName}"`)
  console.log(`   firstName = "${mrz.firstName}"`)
} else {
  console.log('❌  Could not extract name automatically.')
  if (foundCandidate) {
    console.log('\n   Reason: MRZ line found but separator "<<" was misread by OCR.')
    console.log('   This happens when the MRZ zone has low contrast or the image is blurry.')
    console.log('   Staff will need to enter the name manually for this passport.')
  } else {
    console.log('\n   Reason: No MRZ line found in OCR output.')
    console.log('   Ensure the image captures the full passport including the 2 bottom MRZ lines.')
  }
}
