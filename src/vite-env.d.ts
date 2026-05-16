/// <reference types="vite/client" />

interface DesignmeExportResult {
  filePath: string;
  directory: string;
}

interface DesignmeExportBundlePayload {
  name: string;
  files: {
    'index.html': string;
    'styles.css': string;
    'script.js': string;
    'designme.json': string;
    'handoff.md': string;
    'README.md': string;
  };
}

interface Window {
  designme?: {
    exportBundle(payload: DesignmeExportBundlePayload): Promise<DesignmeExportResult>;
    exportHtml(payload: { name: string; html: string }): Promise<DesignmeExportResult>;
    openExports(): Promise<{ directory: string }>;
    copyText(text: string): Promise<void>;
  };
}
