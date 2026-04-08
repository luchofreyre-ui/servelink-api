import { apiFetch } from "./api";
import { readApiJson } from "./api-response";

/**
 * Best-effort fleet context for booking detail side-by-side views.
 * Returns empty when API is unavailable — pages still render primary screen.
 */
export async function loadAdminFleetScreens(_limit: number): Promise<unknown[]> {
  try {
    const landingRes = await apiFetch(
      "/admin/bookings/ops-landing?compact=true",
    );
    const { landing } = await readApiJson<{
      landing?: { workboard?: { sections?: Record<string, unknown[]> } };
    }>(landingRes);
    const ids: string[] = [];
    const sections = landing?.workboard?.sections ?? {};
    for (const key of Object.keys(sections)) {
      const rows = Array.isArray(sections[key]) ? sections[key]! : [];
      for (const r of rows) {
        const row = r as { bookingId?: string };
        const id = String(row?.bookingId ?? "");
        if (id) ids.push(id);
      }
    }
    const unique = Array.from(new Set(ids)).slice(0, _limit);
    const screens = await Promise.all(
      unique.map(async (id) => {
        try {
          const screenRes = await apiFetch(`/bookings/${id}/screen`);
          const { screen } = await readApiJson<{ screen: unknown }>(screenRes);
          return screen;
        } catch {
          return null;
        }
      }),
    );
    return screens.filter(Boolean);
  } catch {
    return [];
  }
}

export async function loadFoFleetScreens(limit: number): Promise<unknown[]> {
  return loadAdminFleetScreens(limit);
}
