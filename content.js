document.addEventListener('keydown', async (event) => {
  if (event.shiftKey && event.key === 'e') {
    const hightlighted_text = window.getSelection().toString().trim();
    console.log(hightlighted_text);

    const result = await browser.storage.local.get("apikey");
    if (result.apikey) {
      browser.runtime.sendMessage({
        action: "explain_text",
        text: hightlighted_text
      });
      console.log("Message sent to background script");
    } else {
      browser.runtime.sendMessage({
        action: "show_error",
        error: "API key not set. Please set the API key in the extension popup."
      });
    }
  }
});

