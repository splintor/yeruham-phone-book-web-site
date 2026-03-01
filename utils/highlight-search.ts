/**
 * Parse search string into terms, mirroring the backend's parseToWords logic:
 * double-quoted segments are kept as a single phrase, unquoted text is split on whitespace.
 */
function parseSearchTerms(search: string): string[] {
  const s = search.trim()
  if (!s) return []

  const pos = s.indexOf('"')
  if (pos === -1 || (pos > 0 && s[pos - 1] !== ' ')) {
    return s.split(/\s+/)
  }

  let nextPos = s.indexOf('"', pos + 1)
  if (nextPos === -1) {
    nextPos = s.length
  }

  return [
    ...parseSearchTerms(s.substring(0, pos)),
    s.substring(pos + 1, nextPos),
    ...parseSearchTerms(s.substring(nextPos + 1)),
  ]
}

function buildSearchRegex(search: string): RegExp | null {
  const terms = parseSearchTerms(search).map(t => t.trim()).filter(Boolean)
  if (terms.length === 0) return null
  const escaped = terms.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(escaped.join('|'), 'gi')
}

/**
 * Wraps occurrences of each search word in `html` with <mark> tags,
 * skipping text that appears inside HTML tags or attributes.
 */
export function highlightSearch(html: string, search: string | undefined): string {
  if (!search?.trim()) return html

  const regex = buildSearchRegex(search)
  if (!regex) return html

  // Split on HTML tags so we only highlight within text nodes
  const parts = html.split(/(<[^>]*>)/)
  return parts.map(part => {
    if (part.startsWith('<')) return part
    return part.replace(regex, '<mark>$&</mark>')
  }).join('')
}

export { buildSearchRegex }
