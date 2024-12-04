const mapping = { // taken from https://github.com/ai/convert-layout/blob/master/he.json
  'q': '/',
  'w': '\'',
  'e': 'ק',
  'r': 'ר',
  't': 'א',
  'y': 'ט',
  'u': 'ו',
  'i': 'ן',
  'o': 'ם',
  'p': 'פ',
  '[': ']',
  '{': '}',
  ']': '[',
  '}': '{',
  '\\': '\\',
  '|': '|',
  'a': 'ש',
  's': 'ד',
  'd': 'ג',
  'f': 'כ',
  'g': 'ע',
  'h': 'י',
  'j': 'ח',
  'k': 'ל',
  'l': 'ך',
  ';': 'ף',
  ':': ':',
  '\'': ',',
  '\"': '\"',
  'z': 'ז',
  'x': 'ס',
  'c': 'ב',
  'v': 'ה',
  'b': 'נ',
  'n': 'מ',
  'm': 'צ',
  ',': 'ת',
  '<': '>',
  '.': 'ץ',
  '>': '<',
  '/': '.',
  '?': '?',
  ' ': ' ',
  '-': '-',
  '_': '_',
  '+': ' ',
}

export function mappedString(s) {
  s = s.toLowerCase()
  const chars = [...s]
  if (chars.some(c => !mapping.hasOwnProperty(c))) {
    return null
  }

  const mapped = chars.map(c => mapping[c]).join('')
  return mapped === s ? null : mapped
}
