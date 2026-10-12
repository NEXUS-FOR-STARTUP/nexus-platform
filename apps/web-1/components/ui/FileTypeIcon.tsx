const ICON_BY_EXTENSION: Record<string, string> = {
  pdf: "/pdf.png",
  doc: "/doc.png",
  docx: "/doc.png",
  xls: "/xls.png",
  xlsx: "/xls.png",
  csv: "/xls.png",
  ppt: "/ppt.png",
  pptx: "/ppt.png",
  txt: "/txt.png",
  md: "/txt.png",
};

const FALLBACK_ICON = "/txt.png";

/** Map a file extension (with or without leading dot) to its icon path. */
export function fileIconSrc(extension?: string | null): string {
  const ext = (extension ?? "").replace(/^\./, "").toLowerCase();
  return ICON_BY_EXTENSION[ext] ?? FALLBACK_ICON;
}

/** Map a file name or URL to its icon path via the trailing extension. */
export function fileIconSrcFromName(name?: string | null): string {
  const match = (name ?? "").split("?")[0].split("#")[0].match(/\.([a-z0-9]+)$/i);
  return fileIconSrc(match?.[1]);
}

interface FileTypeIconProps {
  extension?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/** File-type icon (png) by extension. Prefer `extension`; falls back to parsing `name`. */
export default function FileTypeIcon({ extension, name, size = 28, className }: FileTypeIconProps) {
  const src = extension ? fileIconSrc(extension) : fileIconSrcFromName(name);
  const alt = ((extension ?? name?.split(".").pop() ?? "file") || "file").toUpperCase();
  return <img src={src} alt={alt} width={size} height={size} className={className} style={{ flexShrink: 0 }} />;
}
