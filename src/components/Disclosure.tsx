"use client";
import { useId, useState } from "react";

/** Accessible expandable section with a smooth height and fade transition. */
export function Disclosure({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:text-accent"
      >
        <span>{title}</span>
        <span
          aria-hidden
          className={`font-mono text-lg leading-none text-accent transition-transform duration-300 ease-out ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      <div
        id={id}
        role="region"
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-4 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
