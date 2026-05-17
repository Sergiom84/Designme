import { Paperclip, Send, Square } from 'lucide-react';
import { useState } from 'react';
import type { Attachment } from '../state/types';

interface ComposerProps {
  running: boolean;
  onSend(text: string, attachments?: Attachment[]): void;
  onStop(): void;
}

export function Composer({ running, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="v2-composer">
      <textarea
        aria-label="Prompt"
        placeholder="Describe diseño, adjunta contexto o usa /ask..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <div className="v2-composer__actions">
        <button className="v2-icon-button" type="button" title="Attach">
          <Paperclip size={16} />
        </button>
        {running ? (
          <button className="v2-icon-button" type="button" title="Stop" onClick={onStop}>
            <Square size={16} />
          </button>
        ) : (
          <button className="v2-icon-button" type="button" title="Send" onClick={submit}>
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
