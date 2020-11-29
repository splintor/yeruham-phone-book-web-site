export function pageUrl(title: string): string {
  return '/' + title.replace(/ /g, '_')
}
