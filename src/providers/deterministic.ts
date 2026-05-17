import { buildDesignProject } from '../engine/index';
import type { GenerateEvent, GenerateRequest, Provider } from './types';

async function* generate(req: GenerateRequest): AsyncIterable<GenerateEvent> {
  if (req.signal.aborted) {
    yield { type: 'error', message: 'Generation aborted.' };
    return;
  }

  const output = buildDesignProject({
    prompt: req.prompt,
    artifactType: req.artifactType,
    directionId: req.directionId,
    tweaks: req.tweaks,
  });

  if (req.signal.aborted) {
    yield { type: 'error', message: 'Generation aborted.' };
    return;
  }

  yield {
    type: 'final',
    html: output.html,
    output,
    notes: 'Generated with the deterministic engine.',
  };
}

export const deterministicProvider: Provider = {
  id: 'deterministic',
  label: 'Deterministic',
  async status() {
    return 'ready';
  },
  generate,
};
