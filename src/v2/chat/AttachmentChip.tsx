import { File, Folder, Image } from 'lucide-react';
import type { Attachment } from '../state/types';

interface AttachmentChipProps {
  attachment: Attachment;
}

export function AttachmentChip({ attachment }: AttachmentChipProps) {
  const icon =
    attachment.kind === 'folder' ? <Folder size={14} /> : attachment.kind === 'image' ? <Image size={14} /> : <File size={14} />;
  const label =
    attachment.kind === 'folder'
      ? `${attachment.path} · ${attachment.fileCount} files`
      : attachment.kind === 'image'
        ? 'image'
        : attachment.path;

  return (
    <span className="v2-attachment-chip">
      {icon}
      {label}
    </span>
  );
}
