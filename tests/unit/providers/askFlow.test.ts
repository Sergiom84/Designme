import { describe, expect, it } from 'vitest';
import { parseAskResponse, shouldAskFirst } from '../../../src/providers/shared/askFlow';

describe('askFlow', () => {
  it('parses valid question JSON', () => {
    expect(
      parseAskResponse('{"questions":[{"id":"q1","text":"Audience?","kind":"single","options":["B2B","B2C"]}]}'),
    ).toEqual({
      questions: [{ id: 'q1', text: 'Audience?', kind: 'single', options: ['B2B', 'B2C'] }],
    });
  });

  it('falls back to no questions for invalid JSON', () => {
    expect(parseAskResponse('not json')).toEqual({ questions: [] });
  });

  it('asks first for short prompts', () => {
    expect(shouldAskFirst('landing')).toBe(true);
  });
});
