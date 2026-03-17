'use client'

import { useState, useTransition, useMemo } from 'react'
import { importItemsToTrip } from '@/actions/packing.actions'

interface PasteListModalProps {
  tripId: string
  onClose: () => void
  onSuccess: (count: number) => void
}

interface ParsedItem {
  id: string
  name: string
  quantity: number
}

// Simple parser to extract quantity from strings like "3 shirts", "2x pants", "socks x 4"
function parsePastedText(text: string): ParsedItem[] {
  const lines = text.split('\n')
  const items: ParsedItem[] = []

  // Regex to detect common header or separator lines (e.g., "🧳 Bags", "---", "⸻")
  const headerOrSeparatorRegex = /^[^\w\s]?\s*[\w\s]+:\s*$|^[\W_]+$|^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/;
  // Regex to detect pure tips/notes in parentheses on their own lines or lines starting with "Tip:"
  const pureNoteRegex = /^\(.*?\)$|^Tip:.*$/i;
  // Emojis at start of line
  const emojiRegex = /^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g;
  // Markdown Headers
  const markdownHeaderRegex = /^#{1,6}\s+/;
  // HTML Tags
  const htmlTagsRegex = /<\/?[a-z][\s\S]*?>/gi;

  for (const line of lines) {
    let cleanLine = line.trim()

    if (!cleanLine) continue

    // Strip HTML
    cleanLine = cleanLine.replace(htmlTagsRegex, '').trim()

    if (!cleanLine) continue

    // Ignore lines that are just separators like "---" or "⸻"
    if (/^[-—⸻_=*]+$/.test(cleanLine)) continue

    // Ignore explicit Markdown headers
    if (markdownHeaderRegex.test(cleanLine)) continue

    // Check if line looks like a category header from ChatGPT (often no bullets, short)
    if (pureNoteRegex.test(cleanLine)) continue

    // Check for bullets before stripping emojis to know if it's an actual list item
    const hasBullet = /^[-*•\d+.)\]]+\s*/.test(cleanLine) || cleanLine.includes('•')

    // Remove bold/italic markdown characters (e.g., **Tops** or *Tops*)
    cleanLine = cleanLine.replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2').trim()

    // Remove emojis at the start
    cleanLine = cleanLine.replace(emojiRegex, '').trim()

    // Remove common bullet points and numbering at the start
    cleanLine = cleanLine.replace(/^[-*•\d+.)\]]+\s*/, '').trim()

    if (!cleanLine) continue

    let quantity = 1
    let name = cleanLine
    let isTsv = false

    // TSV / Spreadsheet support
    // If the line contains a tab, it might be from a spreadsheet.
    // E.g., "3 \t Shirts" or "Pants \t 2"
    if (cleanLine.includes('\t')) {
      const parts = cleanLine.split('\t').map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        // Try to figure out which part is the number
        const p1IsNum = /^\d+$/.test(parts[0])
        const p2IsNum = /^\d+$/.test(parts[1])

        if (p1IsNum) {
          quantity = parseInt(parts[0], 10)
          name = parts.slice(1).join(' ')
          isTsv = true
        } else if (p2IsNum) {
          quantity = parseInt(parts[1], 10)
          name = parts[0]
          isTsv = true
        } else {
          // If neither is purely a number, just join them back and proceed normally
          name = parts.join(' ')
        }
      }
    }

    if (!isTsv) {
      // If a line has no bullet, no number prefix, and doesn't explicitly start with a quantity,
      // and is relatively short (1-4 words), it's highly likely a header (e.g., "Clothing", "Tops")
      const wordsCount = cleanLine.split(/\s+/).length
      const startsWithQuantity = /^\d+/.test(cleanLine)

      if (!hasBullet && !startsWithQuantity && wordsCount <= 4) {
        continue;
      }

      // Look for patterns like "3x shirts" or "3 shirts"
      const matchPrefix = cleanLine.match(/^(\d+)[xX\s]+(.*)$/)
      if (matchPrefix) {
        quantity = parseInt(matchPrefix[1], 10)
        name = matchPrefix[2].trim()
      } else {
        // Look for patterns like "shirts x 3" or "shirts x3"
        const matchSuffix = cleanLine.match(/^(.*?)\s+[xX]\s*(\d+)$/)
        if (matchSuffix) {
          name = matchSuffix[1].trim()
          quantity = parseInt(matchSuffix[2], 10)
        }
      }
    }

    // Ensure we don't accidentally import a line that is entirely just a number
    if (/^\d+$/.test(name)) continue

    // Strip out long trailing parentheses like "(great for museums, markets, cafés)"
    // if it makes the item name excessively long.
    name = name.replace(/\s*\([^)]*\)$/, '').trim()

    // Strip inline markdown if it's still left over
    name = name.replace(/(\*\*|__|\*|_)/g, '').trim()

    // Capitalize first letter of name
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1)
    }

    if (name) {
      items.push({
        id: crypto.randomUUID(),
        name,
        quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity
      })
    }
  }

  return items
}

export default function PasteListModal({ tripId, onClose, onSuccess }: PasteListModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [pastedText, setPastedText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleParse = () => {
    const items = parsePastedText(pastedText)
    if (items.length === 0) {
      setError('No items found in the pasted text.')
      return
    }
    setError(null)
    setParsedItems(items)
    setStep(2)
  }

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id))
    if (parsedItems.length === 1) {
      // Last item removed, go back to step 1
      setStep(1)
    }
  }

  const handleImport = () => {
    if (parsedItems.length === 0) return
    setError(null)
    startTransition(async () => {
      const itemsToImport = parsedItems.map(item => ({ name: item.name, quantity: item.quantity }))
      const result = await importItemsToTrip(tripId, itemsToImport)
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess(result.count || 0)
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Paste a List</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1 ? 'Paste your packing list below' : 'Review and import your items'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-md">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}

          {step === 1 ? (
            <div className="space-y-4 flex flex-col h-full">
              <p className="text-sm text-gray-600">
                You can paste a list from anywhere. We&apos;ll do our best to automatically read items and quantities (e.g., &ldquo;3 shirts&rdquo; or &ldquo;pants x2&rdquo;).
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your items here...&#10;&#10;e.g.&#10;3 t-shirts&#10;1 pair of jeans&#10;Toothbrush&#10;- socks x4"
                className="flex-1 min-h-[300px] w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-xl flex items-start gap-3 text-sm">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-medium">We found {parsedItems.length} items!</p>
                  <p className="text-blue-600/80 mt-0.5 text-xs">Review the list below. You can adjust quantities, rename, or remove items before importing them into your trip.</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {parsedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                    <span className="text-xs text-gray-400 font-mono w-5 text-right">{index + 1}.</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-sm border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent transition-colors"
                    />
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <div className="flex-1" />
            {step === 1 ? (
              <button
                onClick={handleParse}
                disabled={!pastedText.trim()}
                className="px-6 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                Review Items <span>→</span>
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={isPending || parsedItems.length === 0}
                className="px-6 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                {isPending ? 'Importing...' : `Import ${parsedItems.length} items`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
