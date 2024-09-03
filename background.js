const explain_text_with_ai = (text) => {
  console.log("Inside the AI fetch function");
  console.log("Now going to explain", text);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received from content script");
  if (message.action === "explain_text") {
    console.log(message.text);
    if (message.text === "") {
      browser.runtime.sendMessage({ action: "show_error" });
    } else {
      explain_text_with_ai(message.text);
    }
  }
});

