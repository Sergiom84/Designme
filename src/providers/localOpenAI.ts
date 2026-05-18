import { DEFAULT_LOCAL_OPENAI_SETTINGS, readLocalOpenAIRuntimeSettings, type LocalOpenAISettings } from '../settings';
import { buildAskMessages, parseAskResponse } from './shared/askFlow';
import { INVALID_HTML_ERROR_MESSAGE, extractStandaloneHtmlDocument } from './htmlExtraction';
import type { GenerateEvent, GenerateRequest, Provider, ProviderStatus } from './types';

const STATUS_TIMEOUT_MS = 2_000;
type LocalOpenAIProviderOptions = Partial<LocalOpenAISettings> | (() => LocalOpenAISettings);

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function buildMessages(req: GenerateRequest): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content:
        'You are Designme Studio. Return one complete, standalone HTML document only. Include CSS and any JavaScript inline.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        prompt: req.prompt,
        artifactType: req.artifactType,
        directionId: req.directionId,
        tweaks: req.tweaks,
        brief: req.brief,
        intent: req.intent,
        workspace: req.workspace?.summary,
      }),
    },
  ];
}

function resolveOptions(options: LocalOpenAIProviderOptions): LocalOpenAISettings {
  return typeof options === 'function' ? options() : { ...DEFAULT_LOCAL_OPENAI_SETTINGS, ...options };
}

function buildHeaders(settings: LocalOpenAISettings): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
  };
}

function createTimeoutSignal(parentSignal: AbortSignal, timeoutMs: number): [AbortSignal, () => void] {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  if (parentSignal.aborted) {
    controller.abort();
  } else {
    parentSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return [
    controller.signal,
    () => {
      globalThis.clearTimeout(timeoutId);
    },
  ];
}

function parseTokenFromData(data: string): string {
  if (data === '[DONE]') {
    return '';
  }

  const parsed = JSON.parse(data) as {
    choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
  };

  return parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? '';
}

async function* streamTokens(response: Response): AsyncIterable<string> {
  if (!response.body) {
    throw new Error('Local OpenAI response did not include a stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const event of events) {
      const dataLines = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());

      if (dataLines.length === 0) continue;

      const data = dataLines.join('\n');
      if (data === '[DONE]') return;

      const token = parseTokenFromData(data);
      if (token) yield token;
    }

    if (done) {
      break;
    }
  }

  const trailingData = buffer
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (trailingData && trailingData !== '[DONE]') {
    const token = parseTokenFromData(trailingData);
    if (token) yield token;
  }
}

async function* generateWithSettings(
  settings: LocalOpenAISettings,
  req: GenerateRequest,
): AsyncIterable<GenerateEvent> {
  const [signal, cleanupSignal] = createTimeoutSignal(req.signal, settings.timeoutMs);

  try {
    const response = await fetch(`${normalizeBaseUrl(settings.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(settings),
      body: JSON.stringify({
        model: settings.model,
        messages: buildMessages(req),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Local OpenAI request failed with ${response.status}.`);
    }

    let content = '';
    for await (const token of streamTokens(response)) {
      content += token;
      yield { type: 'token', text: token };
    }

    const html = extractStandaloneHtmlDocument(content);
    if (!html) {
      yield { type: 'error', message: INVALID_HTML_ERROR_MESSAGE };
      return;
    }

    yield {
      type: 'final',
      html,
      notes: `Generated with local OpenAI-compatible model ${settings.model}.`,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      yield { type: 'error', message: 'Generation aborted.' };
      return;
    }

    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Local OpenAI generation failed.',
    };
  } finally {
    cleanupSignal();
  }
}

export function createLocalOpenAIProvider(
  options: LocalOpenAIProviderOptions = readLocalOpenAIRuntimeSettings,
): Provider {
  return {
    id: 'local-openai',
    label: 'Local OpenAI',
    capabilities: {
      ask: true,
      multiIdea: true,
      streaming: true,
      toolCalls: false,
    },
    async status(): Promise<ProviderStatus> {
      const settings = resolveOptions(options);
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);

      try {
        const response = await fetch(`${normalizeBaseUrl(settings.baseUrl)}/models`, {
          method: 'GET',
          headers: settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : undefined,
          signal: controller.signal,
        });

        return response.ok ? 'ready' : 'error';
      } catch {
        return 'error';
      } finally {
        globalThis.clearTimeout(timeoutId);
      }
    },
    generate(req) {
      return generateWithSettings(resolveOptions(options), req);
    },
    async ask(req) {
      const settings = resolveOptions(options);
      const response = await fetch(`${normalizeBaseUrl(settings.baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(settings),
        body: JSON.stringify({
          model: settings.model,
          messages: buildAskMessages(req),
          stream: false,
        }),
        signal: req.signal,
      });
      if (!response.ok) return { questions: [] };
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return parseAskResponse(payload.choices?.[0]?.message?.content ?? '');
    },
  };
}

export const localOpenAIProvider = createLocalOpenAIProvider();
