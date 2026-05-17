import { buildProviderPrompt } from './shared/multiIdea';
import { createDesktopCliProvider } from './desktopCliBridge';

export const openaiApiProvider = createDesktopCliProvider({
  id: 'openai-api',
  label: 'OpenAI API',
  buildPrompt: buildProviderPrompt,
  failureMessage: 'OpenAI API provider failed.',
  unavailableMessage: 'OpenAI API provider is available only in the desktop app.',
});
