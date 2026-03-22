# Admin UI Build Order

## Recommended implementation order

### Phase 1 — Shell
1. admin layout
2. route protection
3. sidebar navigation
4. page header pattern
5. shared table/filter primitives

### Phase 2 — Highest-value operations
1. dispatch exceptions list
2. booking dispatch detail
3. dispatch explainer panel
4. operator notes
5. manual dispatch actions

### Phase 3 — Config control
1. active + draft config view
2. draft edit form
3. compare view
4. publish preview
5. publish history
6. audit detail
7. restore draft from audit

### Phase 4 — Operational support
1. activity feed
2. anomalies view
3. dashboard composition

## Rule

Do not start with polished dashboard visuals.
Start with the highest operational leverage screens:
- exceptions
- booking detail
- config control
