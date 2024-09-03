const GROQ_API_KEY = 'YOUR_API_KEY';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const explain_text_with_ai = async (text) => {
  console.log("Inside the AI fetch function");
  console.log("Now going to explain", text);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
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
      browser.runtime.sendMessage({ action: "show_error" });
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
  }
});

