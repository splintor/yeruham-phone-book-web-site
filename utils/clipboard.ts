// https://stackoverflow.com/a/30810322/46635
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea")
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = "0"
  textArea.style.left = "0"
  textArea.style.position = "fixed"

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
  }

  document.body.removeChild(textArea)
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text)
    return
  }

  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Async: Could not copy text: ', err)
  }
}
