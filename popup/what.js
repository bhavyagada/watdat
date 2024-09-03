document.addEventListener('DOMContentLoaded', () => {
  const highlightedTextElement = document.getElementById('highlighted_text');
  const explainedTextElement = document.getElementById('explained_text');
  const errorContent = document.getElementById('error-content');
  const popupContent = document.getElementById('popup-content');
  const copyButton = document.getElementById('copy_button');
  const clearButton = document.getElementById('clear_button');

  const update_popup_content = () => {
    browser.storage.local.get(["highlighted", "explained"], (result) => {
      console.log("Local storage data: ", result);
      if (result.highlighted && result.explained) {
        highlightedTextElement.textContent = result.highlighted;
        explainedTextElement.textContent = result.explained;
        errorContent.classList.add('hidden');
        popupContent.classList.remove('hidden');
      } else {
        errorContent.classList.remove('hidden');
        popupContent.classList.add('hidden');
      }
    });
  };

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
      errorContent.classList.remove('hidden');
      popupContent.classList.add('hidden');
    } else {
      update_popup_content();
    }
  });

  // Initial content update
  update_popup_content();
});

