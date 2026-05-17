import type { BuildInput, DesignOutput } from '../../engine';
import { wrapProviderHtml } from '../../engine';
import type { Idea, WorkspaceSnapshot } from '../../v2/state/types';
import { createIdeaDraft } from '../../v2/state/store';
import { getProvider } from '../registry';
import type { GenerateEvent, ProviderId } from '../types';
export { buildProviderPrompt } from './providerPrompt';

export const ideaVariants = [
  { title: 'Minimal editorial', system: 'Variant 0: minimal/editorial. Quiet hierarchy, refined whitespace.' },
  { title: 'Bold campaign', system: 'Variant 1: bold/campaign. Strong focal points, confident visual rhythm.' },
  { title: 'Dense professional', system: 'Variant 2: dense/professional. Operational, scannable, built for repeated use.' },
];

function promptDigest(prompt: string): string {
  let hash = 0;
  for (let index = 0; index < prompt.length; index += 1) {
    hash = (hash << 5) - hash + prompt.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function generateIdeaVariant(input: {
  sessionId: string;
  providerId: ProviderId;
  buildInput: BuildInput;
  variantIndex: number;
  workspace?: WorkspaceSnapshot;
  signal: AbortSignal;
  onEvent?(event: GenerateEvent, idea: Idea): void;
}): Promise<Idea> {
  const variant = ideaVariants[input.variantIndex] ?? ideaVariants[0];
  const provider = getProvider(input.providerId);
  let html = '';
  let output: DesignOutput | undefined;
  let error = '';
  let idea = createIdeaDraft({
    sessionId: input.sessionId,
    variantIndex: input.variantIndex,
    title: variant.title,
    providerId: input.providerId,
    promptDigest: promptDigest(input.buildInput.prompt),
  });
  idea = { ...idea, status: 'streaming' };

  for await (const event of provider.generate({
    ...input.buildInput,
    prompt: `${input.buildInput.prompt}\n\n${variant.system}`,
    workspace: input.workspace,
    signal: input.signal,
  })) {
    input.onEvent?.(event, idea);
    if (event.type === 'final') {
      html = event.html;
      output = event.output ?? wrapProviderHtml(html, input.buildInput);
    }
    if (event.type === 'error') {
      error = event.message;
    }
  }

  if (error && !html) {
    return { ...idea, status: 'error', error };
  }

  return {
    ...idea,
    status: 'ready',
    html,
    designOutput: output,
  };
}

export async function generateIdeas(input: {
  sessionId: string;
  providerId: ProviderId;
  buildInput: BuildInput;
  workspace?: WorkspaceSnapshot;
  signal: AbortSignal;
  count?: number;
  onIdea?(idea: Idea): void;
}): Promise<Idea[]> {
  const count = input.count ?? 3;
  const jobs = ideaVariants.slice(0, count).map(async (_variant, variantIndex) => {
    const idea = await generateIdeaVariant({ ...input, variantIndex });
    input.onIdea?.(idea);
    return idea;
  });
  return Promise.all(jobs);
}
