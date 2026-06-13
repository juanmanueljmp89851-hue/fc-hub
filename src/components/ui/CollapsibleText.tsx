"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
  maxLines?: number;
  className?: string;
}

export function CollapsibleText({ text, maxLines = 3, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const lineHeight = parseFloat(getComputedStyle(ref.current).lineHeight || "20");
      setNeedsCollapse(ref.current.scrollHeight > lineHeight * (maxLines + 0.5));
    }
  }, [text, maxLines]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className="whitespace-pre-line"
        style={!expanded && needsCollapse ? { maxHeight: `${maxLines * 1.5}em`, overflow: "hidden" } : undefined}
      >
        {text}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-accent hover:underline"
        >
          {expanded ? "Ver menos" : "Leer todo"}
        </button>
      )}
    </div>
  );
}
