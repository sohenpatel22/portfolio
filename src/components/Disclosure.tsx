export function Disclosure({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={`group rounded-lg border border-line bg-surface ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium hover:text-accent">
        <span>{title}</span>
        <span aria-hidden className="font-mono text-accent transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}
