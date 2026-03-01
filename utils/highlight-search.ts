function buildSearchRegex(search: string): RegExp | null {
  const words = search.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return null
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
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
