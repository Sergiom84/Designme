/// <reference types="vite/client" />

interface DesignmeExportResult {
  filePath: string;
  directory: string;
}

interface Window {
  designme?: {
    exportHtml(payload: { name: string; html: string }): Promise<DesignmeExportResult>;
    openExports(): Promise<{ directory: string }>;
    copyText(text: string): void;
  };
}
