/**
 * Wraps occurrences of `search` in `html` with <mark> tags,
 * skipping text that appears inside HTML tags or attributes.
 */
export function highlightSearch(html: string, search: string | undefined): string {
  if (!search?.trim()) return html

  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')

  // Split on HTML tags so we only highlight within text nodes
  const parts = html.split(/(<[^>]*>)/)
  return parts.map(part => {
    // If it looks like an HTML tag, leave it alone
    if (part.startsWith('<')) return part
    return part.replace(regex, '<mark>$&</mark>')
  }).join('')
}
