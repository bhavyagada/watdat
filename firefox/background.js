const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
let GROQ_API_KEY = '';

browser.storage.local.get('apikey').then(result => {
  GROQ_API_KEY = result.apikey || '';
});

const explain_text_with_ai = async (text) => {
  if (!GROQ_API_KEY) {
    throw new Error('API key not set. Please set the API key in the extension popup.');
  }

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
            action: 'updated_explanation',
            partial_explanation: data.choices[0].delta.content
          });
        }
      }
    }
  }

  await browser.storage.local.set({ explained: explanation });
  return explanation;
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'explain_text') {
    if (!message.text) {
      browser.runtime.sendMessage({ action: 'show_error', error: 'No text selected. Please highlight some text.' });
    } else if (!GROQ_API_KEY) {
      browser.runtime.sendMessage({ action: 'show_error', error: 'API key not set. Please set the API key in the extension popup.' });
    } else {
      try {
        await browser.storage.local.set({ highlighted: message.text, explained: "" });
        await explain_text_with_ai(message.text);
        browser.runtime.sendMessage({ action: 'explanation_completed' });
      } catch (error) {
        browser.runtime.sendMessage({ action: 'show_error', error: error.message });
      }
      browser.runtime.sendMessage({ action: 'update_popup' });
    }
  } else if (message.action === 'api_key_updated') {
    GROQ_API_KEY = message.apikey;
  }
});

