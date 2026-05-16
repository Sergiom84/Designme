import { useState } from 'react';
import type { PreviewZoom } from '../types/app';

export function usePreviewZoom() {
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>('fit');

  const zoomScale = previewZoom === 'fit' ? 1 : Number(previewZoom) / 100;

  return {
    previewZoom,
    setPreviewZoom,
    zoomScale,
    resetPreviewZoom: () => setPreviewZoom('fit'),
  };
}
