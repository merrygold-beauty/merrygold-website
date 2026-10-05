// Cloudflare Pages Function: POST /api/goldie
//
// Runs Goldie's OpenRouter call server-side so the API key never reaches the
// browser bundle. The client (src/services/goldieChat.js) posts the chat
// history and falls back to its own local knowledge reply on any non-200
// here, so an outage or a missing key degrades gracefully instead of
// showing a blank chat.

import { GOLDIE_SYSTEM_PROMPT } from '../../src/lib/goldiePrompt.js';
import { jsonResponse, unavailableResponse } from '../../src/lib/functionsShared.js';
import { rateLimitResponse } from '../../src/lib/rateLimit.js';
import { SITE_ORIGIN } from '../../src/data/clinic.js';

const MAX_USER_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CONTENT_LENGTH = 2000;
const HISTORY_TURNS_SENT = 6;
const ROLES = new Set(['user', 'assistant']);

function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

// Returns either { userMessage, messages } or { error: '<sentence for the 400 response>' }.
function validateBody(body) {
  const userMessage = body?.userMessage;
  if (typeof userMessage !== 'string' || !userMessage.trim() || userMessage.length > MAX_USER_MESSAGE_LENGTH) {
    return { error: `Please ask a question of ${MAX_USER_MESSAGE_LENGTH} characters or fewer.` };
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length > MAX_HISTORY_MESSAGES) {
    return { error: `Chat history must be an array of ${MAX_HISTORY_MESSAGES} messages or fewer.` };
  }
  for (const entry of messages) {
    if (!ROLES.has(entry?.role) || typeof entry?.content !== 'string' || entry.content.length > MAX_HISTORY_CONTENT_LENGTH) {
      return { error: 'One of the chat history entries is not valid.' };
    }
  }

  return { userMessage, messages };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENROUTER_API_KEY) return unavailableResponse();

  const limited = rateLimitResponse(request, { name: 'goldie', limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('Goldie request body was not valid JSON:', err.message);
    return badRequest('The message could not be read.');
  }

  const result = validateBody(body);
  if (result.error) return badRequest(result.error);
  const { userMessage, messages } = result;

  // Same shape the client used to build itself: system prompt, the last few
  // history turns, then the new question.
  const formattedMessages = [
    { role: 'system', content: GOLDIE_SYSTEM_PROMPT },
    ...messages.slice(-HISTORY_TURNS_SENT).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ];

  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_ORIGIN,
        'X-Title': 'MerryGold Beauty Clinic'
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
        max_tokens: 500,
        temperature: 0.5,
        messages: formattedMessages
      })
    });
  } catch (err) {
    console.error('OpenRouter request failed:', err.message);
    return jsonResponse({ error: 'Goldie could not answer just now.' }, 502);
  }

  const data = await response.json();
  if (!response.ok) {
    console.error('OpenRouter error:', data.error?.message);
    return jsonResponse({ error: 'Goldie could not answer just now.' }, 502);
  }

  const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
  if (!text || !text.trim()) {
    console.error('OpenRouter returned an empty reply');
    return jsonResponse({ error: 'Goldie could not answer just now.' }, 502);
  }

  return jsonResponse({ text: text.trim() });
}
