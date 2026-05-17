import type { Attachment, ChatTurn as ChatTurnValue } from '../state/types';
import { ChatTurn } from './ChatTurn';
import { Composer } from './Composer';

interface ChatRailProps {
  turns: ChatTurnValue[];
  running: boolean;
  onSend(text: string, attachments?: Attachment[]): void;
  onStop(): void;
}

export function ChatRail({ turns, running, onSend, onStop }: ChatRailProps) {
  return (
    <div className="v2-chat-rail">
      <div className="v2-chat-rail__scroll">
        {turns.map((turn) => (
          <ChatTurn key={turn.id} turn={turn} />
        ))}
      </div>
      <Composer running={running} onSend={onSend} onStop={onStop} />
    </div>
  );
}
