const SAFE_PROTOCOLS = ["http:", "https:"];

function safeHref(url: string): string | null {
  try {
    return SAFE_PROTOCOLS.includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}

export function ItemTitle({ title, url }: { title: string; url?: string | null }) {
  const href = url ? safeHref(url) : null;

  if (!href) {
    return <span className="item-title">{title}</span>;
  }

  return (
    <span className="item-title">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
    </span>
  );
}
