import type { ArtifactType } from '../types';

export const sectionBank: Record<ArtifactType, string[]> = {
  software: ['Command center', 'Work queue', 'Insight panel', 'Action drawer', 'Audit trail'],
  web: ['First viewport', 'Product proof', 'Use cases', 'Workflow', 'Conversion rail'],
  dashboard: ['Overview', 'Signal board', 'Pipeline', 'Alerts', 'Decision log'],
  mobile: ['Home', 'Capture', 'Detail', 'Progress', 'Settings'],
  deck: ['Opening claim', 'Market tension', 'Solution', 'Proof', 'Next step'],
  infographic: ['Core thesis', 'Data spine', 'Comparison', 'Implications', 'Action box'],
};
