document.addEventListener('DOMContentLoaded', () => {
  const highlightedText = document.getElementById('highlighted_text');
  const explainedText = document.getElementById('explained_text');
  const errorContent = document.getElementById('error-content');
  const popupContent = document.getElementById('popup-content');
  const copyButton = document.getElementById('copy_button');
  const clearButton = document.getElementById('clear_button');
  const apiKeyInput = document.getElementById('api_key_input');
  const saveApiKeyButton = document.getElementById('save_api_key_button');

  const updatePopupContent = async () => {
    const { highlighted, explained, apikey } = await browser.storage.local.get(['highlighted', 'explained', 'apikey']);

    if (apikey) {
      apiKeyInput.value = apikey;
      saveApiKeyButton.textContent = 'Update API Key';
    } else {
      errorContent.textContent = 'Add your API key to begin using the AI.'
    }

    if (highlighted) {
      highlightedText.textContent = highlighted;
      explainedText.textContent = explained || 'Generating explanation...';
      errorContent.classList.add('hidden');
      popupContent.classList.remove('hidden');
    } else {
      errorContent.classList.remove('hidden');
      popupContent.classList.add('hidden');
    }
  };

  saveApiKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      try {
        await browser.storage.local.set({ apikey: apiKey });
        saveApiKeyButton.textContent = 'API Key Saved!';
        setTimeout(() => {
          saveApiKeyButton.textContent = 'Update API Key!';
        }, 2000);
        browser.runtime.sendMessage({ action: 'api_key_updated', apikey: apiKey });
        errorContent.textContent = 'Highlight some text and press Ctrl+Shift+X to explain it.';
      } catch (error) {
        console.error('Failed to save API key: ', error);
      }
    }
  });

  copyButton.addEventListener('click', async () => {
    const { explained } = await browser.storage.local.get('explained');
    if (explained) {
      try {
        await navigator.clipboard.writeText(explained);
        copyButton.textContent = 'Explanation Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy Explanation';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text: ', error);
      }
    }
  });

  clearButton.addEventListener('click', async () => {
    try {
      await browser.storage.local.remove(["highlighted", "explained"]);
      updatePopupContent();
    } catch (error) {
      console.error('Failed to clear storage: ', error);
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'show_error') {
      errorContent.textContent = message.error || 'An error occurred.';
      errorContent.classList.remove('hidden');
      popupContent.classList.add('hidden');
    } else if (message.action === 'update_popup') {
      updatePopupContent();
    } else if (message.action === 'updated_explanation') {
      if (explainedText.textContent === 'Generating explanation...') {
        explainedText.textContent = message.partial_explanation;
      } else {
        explainedText.textContent += message.partial_explanation;
      }
    }
  });

  // Initial content update
  updatePopupContent();
});

