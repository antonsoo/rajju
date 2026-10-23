export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[c] ?? c;
  });
}

export function number(value: number, digits = 3): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function signed(value: number, digits = 6): string {
  const rounded = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${number(rounded, digits)}`;
}
