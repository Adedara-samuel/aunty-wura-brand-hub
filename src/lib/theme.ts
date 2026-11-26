import type { CSSProperties } from "react";

/** CSS variables for the configurable brand accent, with an accessible foreground colour. */
export function brandStyle(accent: unknown): CSSProperties | undefined {
  if (typeof accent !== "string" || !/^#[0-9a-f]{6}$/i.test(accent)) return undefined;
  const r = parseInt(accent.slice(1, 3), 16) / 255;
  const g = parseInt(accent.slice(3, 5), 16) / 255;
  const b = parseInt(accent.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return { "--brand": accent, "--brand-ink": luminance > 0.45 ? "#1f1a17" : "#ffffff" } as CSSProperties;
}
