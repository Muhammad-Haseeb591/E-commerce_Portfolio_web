/* ------------------------------------------------------------------ */
/*  Seeded random — deterministic per hour, NOT plain Math.random()    */
/* ------------------------------------------------------------------ */
// Plain Math.random() reshuffles on every render/every visitor, which
// looks buggy ("stock count keeps flickering"). Seeding the PRNG with
// the current hour bucket means: the same 4 products + the same
// "units left / units sold" numbers are shown to everyone for that
// whole hour, then the seed changes and the whole thing reshuffles.

// mulberry32: small, fast, deterministic PRNG (returns a fn like Math.random)
export function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle(array, rng) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function seededInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function getHourBucket() {
  return Math.floor(Date.now() / (1000 * 60 * 60))
}
