// borrowed from https://github.com/Dmc0125/html-prettify
const removeEmptyLines = (nonFormattedString: string): string[] =>
  nonFormattedString
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

function toLines(markup: string): string[] {
  let opened = ''

  const nonemptyLines = removeEmptyLines(markup.replace(/</g, '\n<'))

  return nonemptyLines.reduce((formatted, line, i, prevArr) => {
    if (line.startsWith('<')) {
      if (i === prevArr.length - 1) {
        return [...formatted, opened, line]
      }

      const closedLine = opened
      opened = line

      if (closedLine.length) {
        return [...formatted, closedLine]
      }

      return formatted
    }

    // append current line to previous line
    opened += line === '>' ? line : ` ${line}`

    return formatted
  }, [])
}

function addIndentation(htmlLines: string[]): string {
  let level = 0
  const opened: string[] = []

  return htmlLines.reverse().reduce((indented, elTag) => {
    if (opened.length
      && level
      && opened[level]
      /* if current element tag is the same as previously opened one */
      && opened[level] === elTag.substring(1, opened[level].length + 1)
    ) {
      opened.splice(level, 1)
      level--
    }

    const indentation = ' '.repeat(level ? level * 2 : 0)

    const newIndented = [
      `${indentation}${elTag}`,
      ...indented,
    ]

    // if current element tag is closing tag
    // add it to opened elements
    if (elTag.startsWith('</')) {
      level++
      opened[level] = elTag.substring(2, elTag.length - 1)
    }

    return newIndented
  }, []).join('\n')
}

export function htmlPrettify(markup: string): string {
  const lines = toLines(markup)

  return addIndentation(lines)
}
