import { ChatRail } from '../chat/ChatRail';
import type { Attachment, ChatTurn } from '../state/types';

interface LeftRailProps {
  turns: ChatTurn[];
  running: boolean;
  onSend(text: string, attachments?: Attachment[]): void;
  onStop(): void;
}

export function LeftRail({ turns, running, onSend, onStop }: LeftRailProps) {
  return (
    <div className="v2-left-rail">
      <ChatRail turns={turns} running={running} onSend={onSend} onStop={onStop} />
    </div>
  );
}
