import { buildProviderPrompt } from './shared/providerPrompt';
import { createDesktopCliProvider } from './desktopCliBridge';
import { readApiProviderSettings } from '../settings';

export const openaiApiProvider = createDesktopCliProvider({
  id: 'openai-api',
  label: 'OpenAI API',
  buildPrompt: buildProviderPrompt,
  failureMessage: 'OpenAI API provider failed.',
  unavailableMessage: 'OpenAI API provider is available only in the desktop app.',
  providerConfig: () => readApiProviderSettings('openai-api'),
});
