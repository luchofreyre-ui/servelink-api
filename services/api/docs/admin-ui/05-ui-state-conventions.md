# Admin UI State Conventions

## Principle

Every screen should handle:
- loading
- refreshing
- empty
- error
- success

consistently.

---

## Loading states

### Initial page load
Use skeletons or structured placeholders, not spinners alone.

### Small in-panel refresh
Use subtle inline loading indicators.

### Mutations
Disable the relevant controls while a mutation is running.

---

## Error states

### Page-level failure
Use a full panel error state with:
- concise explanation
- retry action

### Section-level failure
Use inline error panel within the affected section.

### Mutation failure
Show inline validation or toast + persistent error text where needed.

---

## Empty states

Empty states should be explicit and calm.

Examples:
- "No dispatch decision history is available for this booking."
- "No activity found."
- "No exceptions match the current filters."

Do not show blank white space where content is missing.

---

## Refreshing states

When refetching existing data:
- keep stale data visible if safe
- show subtle refreshing indicator
- avoid large layout shifts

---

## Success states

For important actions, show clear success feedback.

Examples:
- draft saved
- config published
- rollback restored to draft
- note added
- manual assign completed

Use short toasts or inline banners depending on action importance.

---

## Destructive confirmation rules

Require confirmation for:
- publish
- rollback restore
- manual assign if it replaces an existing assignment
- exclude provider
- anomaly resolve if operationally significant

The confirm dialog must restate the action clearly.

---

## Filter and table state

List screens should preserve:
- current filters
- sort state
- pagination state

where practical when navigating to detail and back.

---

## No-surprise rule

Actions should not silently:
- clear filters
- reset sort
- jump the user to unrelated screens
- discard unsaved edits

---

## Unsaved changes rule

On config-edit surfaces, the UI must make unsaved changes obvious.
Warn before navigation away if there are unsaved edits.
