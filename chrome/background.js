const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
let GROQ_API_KEY = '';

chrome.storage.local.get('apikey').then(result => {
  GROQ_API_KEY = result.apikey || '';
});

const explain_text_with_ai = async (text) => {
  if (!GROQ_API_KEY) {
    throw new Error('API key not set. Please set the API key in the extension popup.');
  }

  console.log("Starting API request...");

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
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

  console.log("API request successful, starting to read stream...");

  const reader = response.body.getReader();
  let explanation = '';
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += new TextDecoder().decode(value);
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices[0].delta.content) {
            explanation += data.choices[0].delta.content;
            console.log("Sending partial explanation:", data.choices[0].delta.content);
            chrome.runtime.sendMessage({
              action: 'updated_explanation',
              partial_explanation: data.choices[0].delta.content
            });
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    }
  }

  console.log("Stream reading complete. Final explanation:", explanation);

  await chrome.storage.local.set({ explained: explanation });
  chrome.runtime.sendMessage({ action: 'explanation_completed', full_explanation: explanation });
  return explanation;
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'explain_text') {
    console.log("Received request to explain text:", request.text);
    chrome.storage.local.set({ highlighted: request.text, explained: "" }, () => {
      chrome.action.openPopup();
      if (!GROQ_API_KEY) {
        console.error("API key not set");
        chrome.runtime.sendMessage({ action: 'show_error', error: 'API key not set. Please set the API key in the extension popup.' });
      } else {
        explain_text_with_ai(request.text)
          .then(() => {
            console.log("Explanation completed");
            chrome.runtime.sendMessage({ action: 'explanation_completed' });
          })
          .catch(error => {
            console.error("Error during explanation:", error);
            chrome.runtime.sendMessage({ action: 'show_error', error: error.message });
          });
      }
    });
  } else if (request.action === 'api_key_updated') {
    console.log("API key updated");
    GROQ_API_KEY = request.apikey;
  }
  return true;
});

