import { describe, expect, it } from 'vitest';
import { deriveBrief } from '../../../src/engine/brief';

describe('deriveBrief', () => {
  it('uses deterministic fallback prompts when the brief is empty', () => {
    const brief = deriveBrief('   ', 'dashboard');

    expect(brief.rawPrompt).toContain('dashboard ejecutivo');
    expect(brief.name).toBe('Signal Desk');
    expect(brief.sections.length).toBeGreaterThan(0);
    expect(brief.features.length).toBeGreaterThan(0);
  });

  it('extracts quoted product names and trims long topics', () => {
    const brief = deriveBrief(
      'Web para "Pulse Board" que explica una plataforma de reporting para equipos ejecutivos con métricas, riesgos y decisiones pendientes.',
      'web',
    );

    expect(brief.name).toBe('Pulse Board');
    expect(brief.topic.length).toBeLessThanOrEqual(150);
  });

  it('infers audience and objective from domain vocabulary', () => {
    const brief = deriveBrief('Software para equipos de ventas que necesita monitorizar KPIs y pipeline comercial.', 'software');

    expect(brief.audience).toBe('equipos comerciales');
    expect(brief.objective).toBe('hacer visible el estado real');
  });

  it('adds keyword features without dropping the base feature bank', () => {
    const brief = deriveBrief('Dashboard CRM de ventas con pipeline, métricas y riesgos para clientes.', 'dashboard');

    expect(brief.features).toEqual(expect.arrayContaining(['tarjetas métricas en vivo', 'salud del pipeline']));
    expect(brief.features.length).toBeLessThanOrEqual(8);
  });
});
