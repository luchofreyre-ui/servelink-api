/**
 * Deterministic dev/test franchise-owner cohort for dispatch + public-booking
 * integration tests. Emails use `@example.com` (RFC 2606) — safe for fixtures.
 *
 * ZIP "coverage" is not a first-class Prisma field; `matchFOs` uses home
 * coordinates + `maxTravelMinutes`. Each profile's home is placed in the primary
 * ZIP listed; additional ZIPs are documented for humans and verified via a
 * stable marker embedded in `FranchiseOwner.bio` (see `dispatchTestFoZipsTag`).
 *
 * ## FO activation / supply readiness (Prisma `franchise-owner-activation-guard`)
 *
 * When `status === active` and the FO is in the booking pool (`evaluateFoActivationSupplyReadiness`):
 * - `homeLat` / `homeLng`: finite, valid lat/lng (not 0,0).
 * - `maxTravelMinutes`: null allowed (DB default); if set, must be finite and ≥ 1.
 * - At least one `FoSchedule` row (`scheduleRowCount >= 1`) — nested on create or via `replaceSchedule` after upsert.
 * - `maxDailyLaborMinutes`, `maxLaborMinutes`, `maxSquareFootage`: each null OR finite and ≥ 1.
 *
 * Execution readiness (`evaluateFoExecutionReadiness`) after create requires
 * `ServiceProvider` linked with `provider.userId === franchiseOwner.userId`
 * (handled by `ensureProviderForFranchiseOwner` in PrismaService extensions).
 *
 * `matchableServiceTypes`: empty array = unrestricted (all service types).
 */

export const DISPATCH_TEST_FO_PASSWORD = "DispatchTestFoProfiles!2026" as const;

/** Machine-parseable suffix on `FranchiseOwner.bio` for verification scripts. */
export function dispatchTestFoZipsTag(zipCodes: readonly string[]): string {
  const normalized = zipCodes.map((z) => z.replace(/\D/g, "").trim()).filter(Boolean);
  return `[[dispatch_test_fo_zips:${normalized.join(",")}]]`;
}

export function parseDispatchTestFoZipsFromBio(bio: string | null | undefined): string[] {
  const m = String(bio ?? "").match(/\[\[dispatch_test_fo_zips:([^\]]+)\]\]/);
  if (!m?.[1]) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type DispatchTestFoScheduleRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type DispatchTestFoProfile = {
  key:
    | "tulsa_central"
    | "tulsa_south"
    | "broken_arrow"
    | "owasso"
    | "bixby_jenks";
  displayName: string;
  email: string;
  phone: string;
  /** Primary service ZIPs this profile is intended to represent (see module doc). */
  serviceZips: readonly string[];
  homeLat: number;
  homeLng: number;
  maxTravelMinutes: number;
  schedule: readonly DispatchTestFoScheduleRow[];
  teamSize: number;
  maxLaborMinutes: number;
  maxDailyLaborMinutes: number;
  maxSquareFootage: number;
};

const BASE_BIO =
  "Dev/test franchise owner for dispatch and booking integration. Not for production use.";

export function buildDispatchTestFoBio(profile: DispatchTestFoProfile): string {
  return `${BASE_BIO}\n\n${dispatchTestFoZipsTag(profile.serviceZips)}`;
}

/**
 * Five FO profiles — idempotent seed keys are `User.email` (unique).
 * dayOfWeek: 0=Sun … 6=Sat (matches `FoSchedule` usage elsewhere in repo).
 */
export const DISPATCH_TEST_FO_PROFILES: readonly DispatchTestFoProfile[] = [
  {
    key: "tulsa_central",
    displayName: "Test FO Tulsa Central",
    email: "test.fo.tulsa.central@example.com",
    phone: "+15555551001",
    serviceZips: ["74103", "74104", "74105"],
    homeLat: 36.1549,
    homeLng: -95.9928,
    maxTravelMinutes: 90,
    schedule: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "08:00",
      endTime: "17:00",
    })),
    teamSize: 4,
    maxLaborMinutes: 960,
    maxDailyLaborMinutes: 2880,
    maxSquareFootage: 8000,
  },
  {
    key: "tulsa_south",
    displayName: "Test FO Tulsa South",
    email: "test.fo.tulsa.south@example.com",
    phone: "+15555551002",
    serviceZips: ["74133", "74136", "74137"],
    homeLat: 36.0971,
    homeLng: -95.8872,
    maxTravelMinutes: 75,
    schedule: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "08:00",
      endTime: "18:00",
    })),
    teamSize: 3,
    maxLaborMinutes: 960,
    maxDailyLaborMinutes: 1920,
    maxSquareFootage: 6000,
  },
  {
    key: "broken_arrow",
    displayName: "Test FO Broken Arrow",
    email: "test.fo.brokenarrow@example.com",
    phone: "+15555551003",
    serviceZips: ["74012", "74014"],
    homeLat: 36.052,
    homeLng: -95.797,
    maxTravelMinutes: 70,
    schedule: [2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
    })),
    teamSize: 3,
    maxLaborMinutes: 900,
    maxDailyLaborMinutes: 1440,
    maxSquareFootage: 5500,
  },
  {
    key: "owasso",
    displayName: "Test FO Owasso",
    email: "test.fo.owasso@example.com",
    phone: "+15555551004",
    serviceZips: ["74055"],
    homeLat: 36.2695,
    homeLng: -95.8547,
    maxTravelMinutes: 60,
    schedule: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "08:00",
      endTime: "16:00",
    })),
    teamSize: 3,
    maxLaborMinutes: 840,
    maxDailyLaborMinutes: 1440,
    maxSquareFootage: 5000,
  },
  {
    key: "bixby_jenks",
    displayName: "Test FO Bixby Jenks",
    email: "test.fo.bixby.jenks@example.com",
    phone: "+15555551005",
    serviceZips: ["74008", "74037"],
    homeLat: 35.9823,
    homeLng: -95.9192,
    maxTravelMinutes: 70,
    schedule: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
    })),
    teamSize: 3,
    maxLaborMinutes: 900,
    maxDailyLaborMinutes: 1680,
    maxSquareFootage: 5500,
  },
] as const;

export const DISPATCH_TEST_FO_EMAILS = DISPATCH_TEST_FO_PROFILES.map((p) => p.email);
