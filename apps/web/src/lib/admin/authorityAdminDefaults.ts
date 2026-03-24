/** Rolling window for authority admin metrics when the API/client omits explicit scope (matches alerts default). */
export const AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS = 168;

/**
 * Minimum persisted authority rows before showing classifier-friction nudges on the quality page.
 * Aligns with the alerts API default `minSampleSize`.
 */
export const AUTHORITY_ADMIN_MIN_SAMPLE_FOR_FRICTION_NUDGE = 10;
