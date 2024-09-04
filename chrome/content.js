window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && (event.key === "E" || event.key === 'e')) {
    const highlightedText = window.getSelection().toString().trim();
    if (highlightedText) {
      chrome.runtime.sendMessage({
        action: 'explain_text',
        text: highlightedText
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'show_error',
        error: 'No text selected. Please highlight some text.'
      });
    }
  }
}, true);

