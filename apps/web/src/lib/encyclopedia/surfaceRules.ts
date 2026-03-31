// surfaceRules.ts

export function normalizeSurface(surface: string): string {
  return surface.trim().toLowerCase();
}

// Optional future hook
export function isSurfaceValid(surface: string): boolean {
  return surface.length > 2;
}
