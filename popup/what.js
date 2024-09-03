document.addEventListener('DOMContentLoaded', () => {
  const highlightedTextElement = document.getElementById('highlighted_text');
  const explainedTextElement = document.getElementById('explained_text');
  const errorContent = document.getElementById('error-content');
  const popupContent = document.getElementById('popup-content');
  const copyButton = document.getElementById('copy_button');
  const clearButton = document.getElementById('clear_button');
  const apiKeyInput = document.getElementById('api_key_input');
  const saveApiKeyButton = document.getElementById('save_api_key_button');

  const update_popup_content = () => {
    browser.storage.local.get(["highlighted", "explained", "apikey"], (result) => {
      console.log("Local storage data: ", result);
      if (result.apikey) {
        apiKeyInput.value = result.apikey;
        saveApiKeyButton.textContent = 'Update API Key';
      } else {
        errorContent.textContent = "Add your API key to begin using the AI."
      }
      if (result.highlighted) {
        highlightedTextElement.textContent = result.highlighted;
        explainedTextElement.textContent = result.explained || 'Generating explanation...';
        errorContent.classList.add('hidden');
        popupContent.classList.remove('hidden');
      } else {
        errorContent.classList.remove('hidden');
        popupContent.classList.add('hidden');
      }
    });
  };

  saveApiKeyButton.addEventListener('click', () => {
    const api_key = apiKeyInput.value.trim();
    if (api_key) {
      browser.storage.local.set({ apikey: api_key }).then(() => {
        console.log('API key saved');
        saveApiKeyButton.textContent = 'API Key Saved!';
        setTimeout(() => {
          saveApiKeyButton.textContent = 'Update API Key!';
        }, 2000);
        browser.runtime.sendMessage({ action: "api_key_updated", apikey: api_key });
      }).catch(error => {
        console.error(`Failed to save API key: ${error}`);
      });
    }
  });

  copyButton.addEventListener('click', () => {
    browser.storage.local.get("explained", (result) => {
      if (result.explained) {
        navigator.clipboard.writeText(result.explained).then(() => {
          console.log('Explanation copied to clipboard');
          copyButton.textContent = 'Explanation Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy Explanation';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });

  clearButton.addEventListener('click', () => {
    browser.storage.local.remove(["highlighted", "explained"]).then(() => {
      console.log('Storage cleared');
      update_popup_content();
    }).catch(error => {
      console.error('Failed to clear storage: ', error);
    });
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "show_error") {
      errorContent.textContent = message.error || "An error occurred.";
      errorContent.classList.remove('hidden');
      popupContent.classList.add('hidden');
    } else if (message.action === "update_popup") {
      update_popup_content();
    } else if (message.action === "updated_explanation") {
      if (explainedTextElement.textContent === 'Generating explanation...') {
        explainedTextElement.textContent = message.partial_explanation;
      } else {
        explainedTextElement.textContent += message.partial_explanation;
      }
    } else if (message.action === "explanation_completed") {
      console.log("Explanation generation complete");
    }
  });

  // Initial content update
  update_popup_content();
});

