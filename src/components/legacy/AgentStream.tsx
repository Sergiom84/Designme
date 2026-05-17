import { Activity, AlertTriangle, CheckCircle2, ChevronDown, Terminal, Wrench } from 'lucide-react';
import type { GenerateEvent, ProviderId } from '../providers/types';
import { classNames } from '../utils/classNames';

type StreamItem =
  | { id: string; type: 'tokens'; text: string }
  | { id: string; type: 'tool-call'; name: string; args: unknown }
  | { id: string; type: 'tool-result'; name: string; result: unknown }
  | { id: string; type: 'final'; html: string; name?: string; notes?: string }
  | { id: string; type: 'error'; message: string };

interface AgentStreamProvider {
  id?: ProviderId | string;
  label: string;
}

export interface AgentStreamProps {
  events: GenerateEvent[];
  running: boolean;
  provider?: AgentStreamProvider;
  providerId?: ProviderId | string;
  providerLabel?: string;
  visible?: boolean;
  onToggleVisible?: () => void;
  className?: string;
}

function getProviderLabel(provider?: AgentStreamProvider, providerLabel?: string, providerId?: string) {
  return provider?.label ?? providerLabel ?? providerId ?? 'Provider';
}

function toPreview(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim() || '""';
  }

  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function compactPreview(value: unknown): string {
  const preview = toPreview(value).replace(/\s+/g, ' ').trim();
  if (preview.length <= 76) {
    return preview;
  }

  return `${preview.slice(0, 73)}...`;
}

function normalizeEvents(events: GenerateEvent[]): StreamItem[] {
  return events.reduce<StreamItem[]>((items, event, index) => {
    if (event.type === 'token') {
      const previous = items[items.length - 1];
      if (previous?.type === 'tokens') {
        previous.text += event.text;
        return items;
      }

      items.push({ id: `tokens-${index}`, type: 'tokens', text: event.text });
      return items;
    }

    if (event.type === 'tool-call') {
      items.push({ id: `tool-call-${index}`, type: event.type, name: event.name, args: event.args });
      return items;
    }

    if (event.type === 'tool-result') {
      items.push({ id: `tool-result-${index}`, type: event.type, name: event.name, result: event.result });
      return items;
    }

    if (event.type === 'final') {
      items.push({
        id: `final-${index}`,
        type: event.type,
        html: event.html,
        name: event.output?.name,
        notes: event.notes,
      });
      return items;
    }

    items.push({ id: `error-${index}`, type: event.type, message: event.message });
    return items;
  }, []);
}

function StreamIcon({ type }: { type: StreamItem['type'] }) {
  if (type === 'tool-call' || type === 'tool-result') {
    return <Wrench size={15} aria-hidden />;
  }

  if (type === 'final') {
    return <CheckCircle2 size={15} aria-hidden />;
  }

  if (type === 'error') {
    return <AlertTriangle size={15} aria-hidden />;
  }

  return <Terminal size={15} aria-hidden />;
}

function ToolDetails({ item }: { item: Extract<StreamItem, { type: 'tool-call' | 'tool-result' }> }) {
  const payload = item.type === 'tool-call' ? item.args : item.result;
  const label = item.type === 'tool-call' ? 'Herramienta' : 'Resultado';

  return (
    <details className="agent-stream-details">
      <summary>
        <span>
          <strong>{label}</strong>
          <small>{item.name}</small>
        </span>
        <code>{compactPreview(payload)}</code>
        <ChevronDown size={15} aria-hidden />
      </summary>
      <pre>{toPreview(payload)}</pre>
    </details>
  );
}

function StreamItemView({ item }: { item: StreamItem }) {
  if (item.type === 'tokens') {
    return (
      <article className="agent-stream-item is-token">
        <StreamIcon type={item.type} />
        <p>{item.text.trim() || item.text}</p>
      </article>
    );
  }

  if (item.type === 'tool-call' || item.type === 'tool-result') {
    return (
      <article className="agent-stream-item is-tool">
        <StreamIcon type={item.type} />
        <ToolDetails item={item} />
      </article>
    );
  }

  if (item.type === 'final') {
    return (
      <article className="agent-stream-item is-final">
        <StreamIcon type={item.type} />
        <div>
          <strong>{item.name ?? 'Final'}</strong>
          {item.notes ? <p>{item.notes}</p> : null}
          <small>{item.html.length.toLocaleString()} caracteres HTML</small>
        </div>
      </article>
    );
  }

  return (
    <article className="agent-stream-item is-error">
      <StreamIcon type={item.type} />
      <p>{item.message}</p>
    </article>
  );
}

export function AgentStream({
  events,
  running,
  provider,
  providerId,
  providerLabel,
  visible = true,
  onToggleVisible,
  className,
}: AgentStreamProps) {
  const items = normalizeEvents(events);
  const displayLabel = getProviderLabel(provider, providerLabel, providerId);
  const statusLabel = running ? 'Generando' : 'En pausa';

  if (!visible) {
    return (
      <section className={classNames('agent-stream is-collapsed', className)} aria-label="Stream del agente">
        <div className="agent-stream-header">
          <div>
            <span className="section-label">Agente</span>
            <strong>{displayLabel}</strong>
          </div>
          {onToggleVisible ? (
            <button type="button" className="icon-button" onClick={onToggleVisible} aria-label="Mostrar agente">
              <Activity size={17} aria-hidden />
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={classNames('agent-stream', className)} aria-label="Stream del agente">
      <div className="agent-stream-header">
        <div>
          <span className="section-label">Agente</span>
          <strong>{displayLabel}</strong>
        </div>
        <div className="agent-stream-actions">
          <span className={classNames('agent-stream-status', running && 'is-running')}>{statusLabel}</span>
          {onToggleVisible ? (
            <button type="button" className="icon-button" onClick={onToggleVisible} aria-label="Ocultar agente">
              <ChevronDown size={17} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="agent-stream-list" aria-live={running ? 'polite' : 'off'} aria-busy={running}>
          {items.map((item) => (
            <StreamItemView key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="agent-stream-empty">
          <Activity size={16} aria-hidden />
          <span>{running ? 'Esperando eventos' : 'Sin eventos'}</span>
        </div>
      )}
    </section>
  );
}
