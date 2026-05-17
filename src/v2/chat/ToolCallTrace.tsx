import type { ToolCall } from '../state/types';

interface ToolCallTraceProps {
  toolCalls: ToolCall[];
}

export function ToolCallTrace({ toolCalls }: ToolCallTraceProps) {
  return (
    <details className="v2-tool-trace">
      <summary>{toolCalls.length} tool calls</summary>
      {toolCalls.map((call) => (
        <pre key={call.id}>{JSON.stringify(call, null, 2)}</pre>
      ))}
    </details>
  );
}
