/** Join class names, skipping falsy values. Variants are literal maps, so no merging is needed. */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
