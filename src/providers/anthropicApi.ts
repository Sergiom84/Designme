import { buildProviderPrompt } from './shared/providerPrompt';
import { createDesktopCliProvider } from './desktopCliBridge';
import { readApiProviderSettings } from '../settings';

export const anthropicApiProvider = createDesktopCliProvider({
  id: 'anthropic-api',
  label: 'Anthropic API',
  buildPrompt: buildProviderPrompt,
  failureMessage: 'Anthropic API provider failed.',
  unavailableMessage: 'Anthropic API provider is available only in the desktop app.',
  providerConfig: () => readApiProviderSettings('anthropic-api'),
});
