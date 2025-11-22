import { ipcMain } from 'electron';

type GeneratePayload = {
  prompt: string;
  type: string;
  tone?: string;
};

function getSystemPrompt(type: string, tone?: string): string {
  const base = 'You are a professional content creator. Output clean, production-ready HTML (inline CSS where necessary).';
  const map: Record<string, string> = {
    landing:
      'Generate a complete landing page with hero, features, benefits, CTA, and footer. Responsive and SEO-friendly.',
    blog:
      'Generate a well-structured article with headings, intro, body with lists where useful, and conclusion with CTA.',
    social:
      'Generate concise social copy (platform-agnostic), with strong hook and clear CTA. Return plain text.',
    email:
      'Generate a marketing email (HTML) with header, body, CTA buttons, and footer. Inline styles for compatibility.'
  };
  const typeHint = map[type] ?? 'Generate high-quality content.';
  const toneHint = tone ? ` Tone: ${tone}.` : '';
  return `${base} ${typeHint}${toneHint}`.trim();
}

export function registerAiProxy(): void {
  ipcMain.handle('ai:generate', async (_evt, payload: GeneratePayload) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { error: 'DEEPSEEK_API_KEY not configured' };
    }
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: getSystemPrompt(payload.type, payload.tone) },
            { role: 'user', content: payload.prompt }
          ],
          stream: false,
          max_tokens: 2000,
          temperature: 0.3
        })
      });
      if (!response.ok) {
        return { error: `DeepSeek API error: ${response.status}` };
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      return { content };
    } catch (err: any) {
      return { error: String(err?.message ?? err) };
    }
  });

  // Optional streaming API (SSE-style parsing)
  ipcMain.handle('ai:generate-stream', async (evt, payload: GeneratePayload) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { error: 'DEEPSEEK_API_KEY not configured' };
    }
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: getSystemPrompt(payload.type, payload.tone) },
            { role: 'user', content: payload.prompt }
          ],
          stream: true,
          temperature: 0.3
        })
      });
      if (!response.ok || !response.body) {
        return { error: `DeepSeek API error: ${response.status}` };
      }
      const reader = response.body.getReader();
      const textDecoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += textDecoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const json = trimmed.slice(5).trim();
            if (json === '[DONE]') {
              evt.sender.send('ai:stream:chunk', { done: true });
              break;
            }
            try {
              const obj = JSON.parse(json);
              const delta = obj?.choices?.[0]?.delta?.content;
              if (delta) {
                evt.sender.send('ai:stream:chunk', { delta });
              }
            } catch {
              // swallow parse errors
            }
          }
        }
      }
      return { ok: true };
    } catch (err: any) {
      return { error: String(err?.message ?? err) };
    }
  });
}
