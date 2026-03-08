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

export function getTripDuration(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
