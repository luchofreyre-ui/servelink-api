/**
 * Create-plan response shape. Customer GET list/detail additionally return
 * `PlanReconciliationFields` on each plan summary / inside detail `item.reconciliation`.
 */
export class RecurringPlanResponseDto {
  recurringPlan!: Record<string, unknown>;
  firstOccurrence!: Record<string, unknown>;
  firstOccurrenceGenerationResult!: Record<string, unknown>;
}
