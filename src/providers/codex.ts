import { buildCodexPrompt } from './codexOutput';
import { createDesktopCliProvider } from './desktopCliBridge';

export const codexProvider = createDesktopCliProvider({
  id: 'codex-cli',
  label: 'Codex',
  buildPrompt: buildCodexPrompt,
  failureMessage: 'Codex provider failed.',
  unavailableMessage: 'Codex está disponible solo en la app de escritorio.',
});
