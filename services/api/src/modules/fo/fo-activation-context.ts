import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Lets trusted code (e.g. `FoScheduleService.setWeeklySchedule`) replace schedules
 * in a transaction without tripping the `foSchedule.deleteMany` guard mid-flight.
 */
export type FoActivationGuardStore = {
  bypassScheduleCoherence?: boolean;
};

export const foActivationGuardAls = new AsyncLocalStorage<FoActivationGuardStore>();
