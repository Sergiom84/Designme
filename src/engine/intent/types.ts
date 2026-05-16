export type Domain =
  | 'crm'
  | 'finance'
  | 'health'
  | 'education'
  | 'marketing'
  | 'design'
  | 'operations'
  | 'productivity'
  | 'generic';

export type UserGoal =
  | 'convert'
  | 'monitor'
  | 'explain'
  | 'coordinate'
  | 'decide'
  | 'learn'
  | 'prototype';

export type ScreenState = 'default' | 'empty' | 'loading' | 'error' | 'success' | 'review';

export interface ModuleRequirement {
  id: string;
  label: string;
  purpose: string;
  priority: 1 | 2 | 3;
  states: ScreenState[];
  dataShape?: Record<string, string>;
}

export interface UXIntent {
  domain: Domain;
  goal: UserGoal;
  primaryAction: string;
  secondaryAction?: string;
  userMentalModel: string;
  modules: ModuleRequirement[];
  requiredStates: ScreenState[];
  riskNotes: string[];
}
