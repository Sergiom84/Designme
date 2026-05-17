import type { Question } from '../state/types';

interface AskQuestionCardProps {
  questions: Question[];
  onContinue?(answers: Record<string, string | string[]>): void;
  onSkip?(): void;
}

export function AskQuestionCard({ questions, onContinue, onSkip }: AskQuestionCardProps) {
  return (
    <div className="v2-ask-card">
      {questions.map((question) => (
        <fieldset key={question.id}>
          <legend>{question.text}</legend>
          {question.kind === 'text' ? (
            <textarea aria-label={question.text} />
          ) : (
            <div className="v2-chip-row">
              {(question.options ?? []).map((option) => (
                <button key={option} type="button">
                  {option}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ))}
      <div className="v2-ask-card__actions">
        <button type="button" onClick={() => onContinue?.({})}>
          Continue
        </button>
        <button type="button" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
