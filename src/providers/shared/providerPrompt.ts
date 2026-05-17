import type { BuildInput } from '../../engine';
import type { WorkspaceSnapshot } from '../../v2/state/types';

export function buildProviderPrompt(req: BuildInput & { workspace?: WorkspaceSnapshot }): string {
  return [
    'You are Designme Studio. Return exactly one complete standalone HTML document. No markdown fences.',
    `Artifact type: ${req.artifactType}`,
    `Direction: ${req.directionId}`,
    `Tweaks: ${JSON.stringify(req.tweaks)}`,
    req.workspace?.summary ? `<workspace_context>\n${req.workspace.summary}\n</workspace_context>` : '',
    `User prompt:\n${req.prompt}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
