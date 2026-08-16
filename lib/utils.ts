import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string, options?: { includeTimezone?: boolean }): string {
  // If it's a string in YYYY-MM-DD format, parse it as local date to avoid timezone shifts
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.split('T')[0].split('-').map(Number)
    const d = new Date(year, month - 1, day) // month is 0-indexed
    
    const formatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    if (options?.includeTimezone) {
      // Get timezone abbreviation (e.g., PST, EST, GMT)
      const timezone = d.toLocaleDateString('en-US', {
        day: '2-digit',
        timeZoneName: 'short'
      }).split(', ')[1]
      
      return `${formatted} ${timezone}`
    }
    
    return formatted
  }
  
  // Otherwise use the date as-is
  const d = new Date(date)
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  if (options?.includeTimezone) {
    const timezone = d.toLocaleDateString('en-US', {
      day: '2-digit',
      timeZoneName: 'short'
    }).split(', ')[1]
    
    return `${formatted} ${timezone}`
  }
  
  return formatted
}

/**
 * Format date with timezone based on IANA timezone identifier
 * @param date - Date to format
 * @param timeZone - IANA timezone identifier (e.g., 'America/Los_Angeles', 'Europe/London')
 * @returns Formatted date with timezone abbreviation
 */
export function formatDateWithTimezone(date: Date | string, timeZone: string): string {
  // Parse date string as local date to avoid timezone shifts
  let d: Date
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.split('T')[0].split('-').map(Number)
    d = new Date(year, month - 1, day)
  } else {
    d = new Date(date)
  }
  
  try {
    // Format the date in the target timezone
    const formatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone
    })
    
    // Get timezone abbreviation
    const timezone = d.toLocaleDateString('en-US', {
      day: '2-digit',
      timeZoneName: 'short',
      timeZone
    }).split(', ')[1]
    
    return `${formatted} ${timezone}`
  } catch (error) {
    // Fallback to regular formatting if timezone is invalid
    console.warn(`Invalid timezone: ${timeZone}`, error)
    return formatDate(date, { includeTimezone: true })
  }
}

export function getTripDuration(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Safely stringifies and escapes JSON-LD structured data to prevent XSS vulnerabilities.
 * It replaces sensitive characters with their unicode equivalents so the payload safely
 * stays within a <script type="application/ld+json"> tag.
 */
export function serializeJsonLd(data: any): string {
  return (JSON.stringify(data) || '{}')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}
