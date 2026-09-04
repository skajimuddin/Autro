// Device detection — one job: tell a phone from a desktop/laptop.
//
// Why this exists: workshop GPS location is captured once, standing inside
// the garage, and staff check-in distance is measured against it. A laptop
// reports network/IP-based location (often kilometres off, sometimes a
// different city), which would silently poison every check-in after. There
// is no reliable browser signal for "this device is indoors at the garage",
// so instead we refuse the easy way to get it wrong: no desktop can submit a
// workshop location at all.
//
// Touch support is the signal, not user-agent sniffing — a UA string is
// trivially wrong (desktop Chrome's mobile emulation, an unusual browser) and
// this only has to be right for "does this hardware have GPS", which coarse
// pointer + touch capability answers well enough. `maxTouchPoints` alone is
// not enough: some touch-enabled laptops (Surface, 2-in-1s) report touch but
// still sit on a desk with the same bad-location problem, so pointer type is
// checked too — both must agree the primary input is a touchscreen.
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false

  const hasTouch = navigator.maxTouchPoints > 0
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const noHover = window.matchMedia?.('(hover: none)').matches ?? false

  return hasTouch && coarsePointer && noHover
}
