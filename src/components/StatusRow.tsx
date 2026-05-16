interface StatusRowProps {
  status: string;
  exportPath: string;
}

export function StatusRow({ status, exportPath }: StatusRowProps) {
  return (
    <footer className="status-row" role="status" aria-live="polite" aria-atomic="true">
      <span>{status}</span>
      {exportPath ? <code>{exportPath}</code> : <code>Sin API keys. Todo se genera localmente.</code>}
    </footer>
  );
}
