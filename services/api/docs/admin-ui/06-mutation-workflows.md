# Admin UI Mutation Workflows

## Rule

Every write action in the Admin UI must have a defined workflow.
No important mutation should be "button -> surprise result."

---

## 1. Save dispatch config draft

Flow:
1. user edits draft values
2. UI marks draft as dirty
3. user clicks Save draft
4. request sent to `POST /api/v1/admin/dispatch-config/draft`
5. on success:
   - form state syncs to returned draft
   - dirty state clears
   - success feedback shown

---

## 2. Publish dispatch config

Flow:
1. user reviews compare
2. user reviews publish preview
3. user clicks Publish
4. confirm modal explains impact
5. request sent to `POST /api/v1/admin/dispatch-config/publish`
6. on success:
   - active config refreshes
   - draft refreshes
   - publish history refreshes
   - activity feed refreshes
   - success confirmation shown

---

## 3. Restore draft from audit

Flow:
1. user opens config history
2. user opens one audit detail
3. user clicks Restore to draft
4. confirm modal explains that active config will not change yet
5. request sent to `POST /api/v1/admin/dispatch-config/rollback-from-audit`
6. on success:
   - draft reloads with restored values
   - compare updates
   - preview updates
   - success feedback shown

---

## 4. Add operator note

Flow:
1. user opens booking dispatch detail
2. user writes note
3. user clicks Save note
4. request sent to operator note endpoint
5. on success:
   - notes section refreshes
   - activity feed may refresh
   - textarea clears if appropriate

---

## 5. Manual redispatch

Flow:
1. user opens booking dispatch detail
2. user clicks Manual redispatch
3. confirm modal explains action
4. request sent to manual redispatch endpoint
5. on success:
   - timeline refreshes
   - explainer refreshes if needed
   - booking state refreshes
   - success feedback shown

---

## 6. Manual assign

Flow:
1. user opens booking dispatch detail
2. user clicks Manual assign
3. user selects provider
4. confirm modal explains booking + provider
5. request sent to manual assign endpoint
6. on success:
   - booking state refreshes
   - timeline refreshes
   - explainer refreshes
   - success feedback shown

---

## 7. Exclude provider

Flow:
1. user opens booking dispatch detail
2. user clicks Exclude provider
3. user selects or confirms target provider
4. confirm modal explains exclusion effect
5. request sent to exclude provider endpoint
6. on success:
   - timeline refreshes
   - explainer refreshes
   - success feedback shown

---

## 8. Anomaly actions

Examples:
- acknowledge
- resolve
- assign
- unassign

Flow:
1. user initiates action
2. confirmation used where appropriate
3. request sent
4. on success:
   - anomaly list refreshes
   - audit/history refreshes
   - activity feed refreshes if shown

---

## Mutation UX rules

- Mutations should be idempotency-aware where backend supports it.
- Relevant sections should refresh after success.
- Important actions must have confirmations.
- Disable duplicate submits while pending.
- Always show failure feedback when a mutation fails.
