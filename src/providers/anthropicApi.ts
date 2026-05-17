import { buildProviderPrompt } from './shared/providerPrompt';
import { createDesktopCliProvider } from './desktopCliBridge';

export const anthropicApiProvider = createDesktopCliProvider({
  id: 'anthropic-api',
  label: 'Anthropic API',
  buildPrompt: buildProviderPrompt,
  failureMessage: 'Anthropic API provider failed.',
  unavailableMessage: 'Anthropic API provider is available only in the desktop app.',
});
