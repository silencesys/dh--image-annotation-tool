/**
 * Copy code snippet to clipboard.
 * @param {string} text - The code to copy.
 */
const copyTextToClipboard = (text) => {
  if (!navigator.clipboard) {
    return
  }
  navigator.clipboard.writeText(text)
}

export {
  copyTextToClipboard
}
