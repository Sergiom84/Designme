import type { Domain } from '../../intent/types';
import type { ArtifactType, DerivedBrief } from '../../types';
import type { UXIntent } from '../../intent/types';

export type SkeletonKind = 'command-center' | 'lane-board' | 'narrative-stack';
export type VariationEmphasis = 'metrics' | 'tasks' | 'story';
export type ModuleStrategy = 'priority' | 'risk-first' | 'journey';

export interface RenderVariation {
  id: string;
  label: string;
  domain: Domain;
  skeleton: SkeletonKind;
  shellClass: string;
  emphasis: VariationEmphasis;
  moduleStrategy: ModuleStrategy;
}

const domainLabels: Record<Domain, string> = {
  crm: 'pipeline',
  finance: 'audit',
  health: 'care',
  education: 'learning',
  marketing: 'conversion',
  design: 'critique',
  operations: 'ops',
  productivity: 'focus',
  generic: 'overview',
};

function createDomainVariations(domain: Domain): RenderVariation[] {
  const label = domainLabels[domain];
  return [
    {
      id: `${domain}-${label}-command`,
      label: `${label} command`,
      domain,
      skeleton: 'command-center',
      shellClass: 'variation-command-center',
      emphasis: 'metrics',
      moduleStrategy: 'priority',
    },
    {
      id: `${domain}-${label}-lanes`,
      label: `${label} lanes`,
      domain,
      skeleton: 'lane-board',
      shellClass: 'variation-lane-board',
      emphasis: 'tasks',
      moduleStrategy: 'risk-first',
    },
    {
      id: `${domain}-${label}-story`,
      label: `${label} story`,
      domain,
      skeleton: 'narrative-stack',
      shellClass: 'variation-narrative-stack',
      emphasis: 'story',
      moduleStrategy: 'journey',
    },
  ];
}

const domainVariations: Record<Domain, RenderVariation[]> = {
  crm: createDomainVariations('crm'),
  finance: createDomainVariations('finance'),
  health: createDomainVariations('health'),
  education: createDomainVariations('education'),
  marketing: createDomainVariations('marketing'),
  design: createDomainVariations('design'),
  operations: createDomainVariations('operations'),
  productivity: createDomainVariations('productivity'),
  generic: createDomainVariations('generic'),
};

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function selectRenderVariation(
  brief: DerivedBrief,
  artifactType: ArtifactType,
  intent: UXIntent,
): RenderVariation {
  const variations = domainVariations[intent.domain] ?? domainVariations.generic;
  const seed = `${artifactType}:${intent.domain}:${brief.rawPrompt.trim().toLowerCase()}`;
  return variations[stableHash(seed) % variations.length];
}

export function orderByVariation<T>(items: T[], variation: RenderVariation): T[] {
  if (variation.moduleStrategy === 'risk-first') return [...items].reverse();
  if (variation.moduleStrategy === 'journey') {
    const [first, ...rest] = items;
    return first ? [...rest, first] : [];
  }
  return [...items];
}

export function renderVariationAttributes(variation: RenderVariation): string {
  return `data-render-variation="${variation.id}" data-render-skeleton="${variation.skeleton}"`;
}
