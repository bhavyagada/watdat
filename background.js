const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let GROQ_API_KEY = '';
browser.storage.local.get("apikey", (result) => {
  if (result.apikey) {
    GROQ_API_KEY = result.apikey;
  }
});

const explain_text_with_ai = async (text) => {
  console.log("Inside the AI fetch function");
  console.log("Now going to explain", text);

  if (!GROQ_API_KEY) {
    throw new Error("API key not set. Please set the API key in the extension popup.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that explains text concisely and in simple terms.' },
        { role: 'user', content: `Please explain this succinctly: ${text}` }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  let explanation = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = JSON.parse(line.slice(6));
        if (data.choices[0].delta.content) {
          explanation += data.choices[0].delta.content;

          browser.runtime.sendMessage({
            action: "updated_explanation",
            partial_explanation: data.choices[0].delta.content
          });
        }
      }
    }
  }

  await browser.storage.local.set({ explained: explanation });
  console.log("Final explanation saved to storage");

  return explanation;
}

browser.runtime.onMessage.addListener((message) => {
  console.log("Message received from content script");
  if (message.action === "explain_text") {
    console.log(message.text);
    if (message.text === "") {
      browser.runtime.sendMessage({ action: "show_error", error: "No text selected. Please highlight some text." });
    } else if (!GROQ_API_KEY) {
      browser.runtime.sendMessage({ action: "show_error", error: "API key not set. Please set the API key in the extension popup." });
    } else {
      browser.storage.local.set({
        highlighted: message.text,
        explained: "" // Initialize with empty string
      }).then(() => {
        console.log("Initial data saved to storage");
        explain_text_with_ai(message.text).then(() => {
          browser.runtime.sendMessage({ action: "explanation_completed" });
        }).catch(error => {
          console.error("Error in AI explanation: ", error);
          browser.runtime.sendMessage({ action: "show_error", error: error.message });
        });
        browser.runtime.sendMessage({ action: "update_popup" });
      }).catch((error) => {
        console.error("Error saving data to storage: ", error);
      });
    }
  } else if (message.action === "api_key_updated") {
    GROQ_API_KEY = message.apikey;
    console.log('API key updated in background script!');
  }
});

