import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { ChatTurn as ChatTurnValue } from '../state/types';
import { AskQuestionCard } from './AskQuestionCard';
import { ToolCallTrace } from './ToolCallTrace';

interface ChatTurnProps {
  turn: ChatTurnValue;
}

export function ChatTurn({ turn }: ChatTurnProps) {
  const html = useMemo(() => ({ __html: DOMPurify.sanitize(marked.parse(turn.text, { async: false }) as string) }), [turn.text]);

  return (
    <article className={`v2-chat-turn is-${turn.role}`}>
      <div className="v2-chat-turn__meta">
        <span>{turn.role}</span>
        <time>{new Date(turn.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
      </div>
      <div className="v2-chat-turn__body" dangerouslySetInnerHTML={html} />
      {'askQuestions' in turn && turn.askQuestions?.length ? <AskQuestionCard questions={turn.askQuestions} /> : null}
      {'toolCalls' in turn && turn.toolCalls?.length ? <ToolCallTrace toolCalls={turn.toolCalls} /> : null}
    </article>
  );
}
