'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: React.ReactNode
  error?: string
  value: string | null
  onChange: (val: string | null) => void
}

export function DateInput({ label, error, value, onChange, id, 'aria-describedby': ariaDescribedby, className, ...props }: DateInputProps) {
  const [localValue, setLocalValue] = useState(value || '')
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  // Sync external value
  useEffect(() => {
    if (value !== null && value !== localValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalValue(value)
    }
  }, [value, localValue])

  const isValidDate = (dateString: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(regex)
    if (!match) return false
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    if (month < 1 || month > 12) return false
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  }

  const parseAndFormatDate = (dateString: string) => {
    if (!isValidDate(dateString)) {
      setConfirmationMessage(null)
      return
    }

    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(regex)
    if (!match) return

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)
    const date = new Date(year, month - 1, day)

    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)

    setConfirmationMessage(`You will arrive on ${formattedDate}.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '')
    if (input.length > 8) {
      input = input.substring(0, 8)
    }
    
    // Auto-format as DD/MM/YYYY
    let formatted = input
    if (input.length > 4) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}/${input.substring(4, 8)}`
    } else if (input.length > 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}`
    }

    setLocalValue(formatted)
    onChange(formatted.length === 10 ? formatted : null) // Only update external value if it's a complete date string
    parseAndFormatDate(formatted)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) {
      props.onBlur(e)
    }
    onChange(localValue || null) // update form state on blur
  }

  const errorId = ariaDescribedby ?? (id ? `${id}-error` : undefined)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...props}
        id={id}
        type="text"
        placeholder="DD/MM/YYYY"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        aria-describedby={errorId}
        className={cn(error && "border-destructive")}
      />
      {confirmationMessage && !error && (
        <p className="text-xs text-muted-foreground mt-1">
          {confirmationMessage}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
