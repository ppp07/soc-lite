/** Small seeded PRNG (mulberry32): the same seed always yields the same sequence. */
export function createRng(seed: number) {
  let state = seed >>> 0
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    /** Inclusive integer in [min, max]. */
    int: (min: number, max: number): number => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    /** Lowercase hex string, e.g. an ObjectId-like id. */
    hex: (length: number): string =>
      Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join(''),
  }
}

export type Rng = ReturnType<typeof createRng>
