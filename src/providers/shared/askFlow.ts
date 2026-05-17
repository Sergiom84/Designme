import type { AskRequest, AskResponse } from '../types';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export function buildAskMessages(req: AskRequest): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are an open-codesign-style design partner. Return only JSON. Ask 1-3 clarifying questions only if brief is ambiguous.',
    },
    {
      role: 'user',
      content: `User brief: """${req.prompt}"""
Workspace summary: ${req.workspace?.summary ?? 'none'}

Return JSON like {"questions":[{"id":"q1","text":"...","kind":"single","options":["A","B"]}]}.
If clear enough, return {"questions":[]}.`,
    },
  ];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function parseAskResponse(text: string): AskResponse {
  try {
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0] ?? text;
    const parsed = asRecord(JSON.parse(jsonText) as unknown);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    return {
      questions: questions
        .map((item, index) => {
          const record = asRecord(item);
          const kind: 'single' | 'multi' | 'text' =
            record.kind === 'multi' || record.kind === 'text' ? record.kind : 'single';
          const options = Array.isArray(record.options)
            ? record.options.filter((option): option is string => typeof option === 'string').slice(0, 6)
            : undefined;
          return {
            id: typeof record.id === 'string' ? record.id : `q${index + 1}`,
            text: typeof record.text === 'string' ? record.text : '',
            kind,
            options,
          };
        })
        .filter((question) => question.text.length > 0)
        .slice(0, 3),
    };
  } catch {
    return { questions: [] };
  }
}

export function shouldAskFirst(prompt: string): boolean {
  const trimmed = prompt.trim().toLowerCase();
  if (trimmed.length < 40) return true;
  return ['algo', 'moderno', 'bonito', 'mejor', 'landing', 'dashboard'].some((word) => trimmed === word);
}
