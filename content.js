document.addEventListener('keydown', (event) => {
  if (event.shiftKey && event.key === 'e') {
    const hightlighted_text = window.getSelection().toString().trim();
    console.log(hightlighted_text);
    browser.runtime.sendMessage({
      action: "explain_text",
      text: hightlighted_text
    });
    console.log("Message sent to background script");
  }
});

