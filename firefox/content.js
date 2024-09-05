document.addEventListener('keydown', async (event) => {
  if (event.shiftKey && event.key === 'x') {
    const hightlighted_text = window.getSelection().toString().trim();
    const { apikey } = await browser.storage.local.get('apikey');
    if (apikey) {
      browser.runtime.sendMessage({
        action: 'explain_text',
        text: hightlighted_text
      });
    } else {
      browser.runtime.sendMessage({
        action: 'show_error',
        error: 'API key not set. Please set the API key in the extension popup.'
      });
    }
  }
});

