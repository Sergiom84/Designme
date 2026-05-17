import { buildClaudeCodePrompt } from './claudeCodeOutput';
import { createDesktopCliProvider } from './desktopCliBridge';

export const claudeCodeProvider = createDesktopCliProvider({
  id: 'claude-code',
  label: 'Claude Code',
  buildPrompt: buildClaudeCodePrompt,
  failureMessage: 'Claude Code provider failed.',
  unavailableMessage: 'Claude Code está disponible solo en la app de escritorio.',
});
