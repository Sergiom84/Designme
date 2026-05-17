import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderSetupHints } from '../../../src/components/ProviderSetupHints';

const detection: DesignmeLocalSetupDetection = {
  generatedAt: '2026-05-17T10:00:00.000Z',
  providers: [
    {
      id: 'claude-code',
      label: 'Claude Code',
      detected: true,
      ready: true,
      configFound: true,
      cliFound: true,
      version: 'claude 1.2.3',
    },
    {
      id: 'codex',
      label: 'Codex',
      detected: false,
      ready: false,
      configFound: false,
      cliFound: false,
    },
  ],
  localOpenAI: {
    id: 'ollama',
    label: 'Ollama',
    detected: true,
    ready: true,
    configFound: true,
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3.2:latest',
  },
};

const settings = {
  baseUrl: 'https://gateway.example/v1',
  model: 'remote-model',
  apiKey: '',
  timeoutMs: 60000,
};

describe('ProviderSetupHints', () => {
  const originalDesignme = window.designme;

  afterEach(() => {
    window.designme = originalDesignme;
    cleanup();
  });

  it('offers activation for ready desktop providers and Ollama import', () => {
    const onActivateProvider = vi.fn();
    const onUseOllama = vi.fn();

    render(
      <ProviderSetupHints
        detection={detection}
        activeProviderId="deterministic"
        localOpenAISettings={settings}
        dismissed={false}
        checking={false}
        onActivateProvider={onActivateProvider}
        onUseOllama={onUseOllama}
        onRefresh={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Activar Claude Code' }));
    expect(onActivateProvider).toHaveBeenCalledWith('claude-code');

    fireEvent.click(screen.getByRole('button', { name: 'Usar Ollama' }));
    expect(onUseOllama).toHaveBeenCalledWith({
      baseUrl: 'http://127.0.0.1:11434/v1',
      model: 'llama3.2:latest',
    });
    expect(screen.queryByRole('button', { name: 'Activar Codex' })).not.toBeInTheDocument();
  });

  it('stays hidden when dismissed', () => {
    render(
      <ProviderSetupHints
        detection={detection}
        activeProviderId="deterministic"
        localOpenAISettings={settings}
        dismissed={true}
        checking={false}
        onActivateProvider={vi.fn()}
        onUseOllama={vi.fn()}
        onRefresh={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Configuración rápida de providers')).not.toBeInTheDocument();
  });

  it('stays hidden when no action is available', () => {
    render(
      <ProviderSetupHints
        detection={{
          ...detection,
          providers: [],
          localOpenAI: { ...detection.localOpenAI, ready: false, model: undefined, baseUrl: settings.baseUrl },
        }}
        activeProviderId="local-openai"
        localOpenAISettings={settings}
        dismissed={false}
        checking={false}
        onActivateProvider={vi.fn()}
        onUseOllama={vi.fn()}
        onRefresh={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.queryByText('Providers detectados')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Configuración rápida de providers')).not.toBeInTheDocument();
  });

  it('shows a compact detection action before results are available', () => {
    window.designme = { ...originalDesignme, detectLocalSetup: vi.fn() } as NonNullable<Window['designme']>;
    const onRefresh = vi.fn();

    render(
      <ProviderSetupHints
        activeProviderId="deterministic"
        localOpenAISettings={settings}
        dismissed={false}
        checking={false}
        onActivateProvider={vi.fn()}
        onUseOllama={vi.fn()}
        onRefresh={onRefresh}
        onDismiss={vi.fn()}
      />,
    );

    onRefresh.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar providers' }));
    expect(screen.getByText('Detectar providers')).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('auto-runs detection once on desktop before results are available', async () => {
    window.designme = { ...originalDesignme, detectLocalSetup: vi.fn() } as NonNullable<Window['designme']>;
    const onRefresh = vi.fn();

    render(
      <ProviderSetupHints
        activeProviderId="deterministic"
        localOpenAISettings={settings}
        dismissed={false}
        checking={false}
        onActivateProvider={vi.fn()}
        onUseOllama={vi.fn()}
        onRefresh={onRefresh}
        onDismiss={vi.fn()}
      />,
    );

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
