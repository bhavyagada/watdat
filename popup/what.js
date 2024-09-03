document.addEventListener('DOMContentLoaded', () => {
  // const highlightedTextElement = document.getElementById('highlighted_text');
  // const explainedTextElement = document.getElementById('explained_text');
  const errorContent = document.getElementById('error-content');
  const popupContent = document.getElementById('popup-content');
  // const copyButton = document.getElementById('copy_button');

  errorContent.classList.remove('hidden');
  popupContent.classList.add('hidden');

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "show_error") {
      errorContent.classList.remove('hidden');
      popupContent.classList.add('hidden');
    }
  });
});

