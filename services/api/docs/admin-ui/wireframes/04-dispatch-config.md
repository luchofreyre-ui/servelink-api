# Dispatch Config

## Route
- `/admin/dispatch-config`

## Purpose
Control live dispatch behavior safely.

## Permissions
- dispatch.read
- dispatch.write
- dispatch.publish
- dispatch.rollback
- audit.read

## Primary APIs
- `GET /api/v1/admin/dispatch-config/active`
- `GET /api/v1/admin/dispatch-config/draft`
- `POST /api/v1/admin/dispatch-config/draft`
- `GET /api/v1/admin/dispatch-config/compare`
- `GET /api/v1/admin/dispatch-config/publish-preview`
- `POST /api/v1/admin/dispatch-config/publish`
- `GET /api/v1/admin/dispatch-config/publish-history`
- `GET /api/v1/admin/dispatch-config/publish-history/latest`
- `GET /api/v1/admin/dispatch-config/publish-history/:auditId`
- `POST /api/v1/admin/dispatch-config/rollback-from-audit`

## Page layout

```text
Header
- Title: Dispatch Config
- Subtitle: Manage live dispatch behavior
- Actions: Save Draft | Publish

Main body with tabs
- Draft
- Compare
- Preview
- History
```

## Tab: Draft
- editable config form
- dirty-state indicator
- owner/admin capability-gated actions

## Tab: Compare
- active vs draft diff list
- impact levels
- field messages

## Tab: Preview
- warnings
- highlights
- publish summary

## Tab: History
- publish history list
- audit detail side panel or detail route
- restore to draft action

## Key workflows
- edit draft
- save draft
- compare
- preview
- publish
- restore to draft from audit

## Empty states
- no history yet
- no changes between draft and active

## Loading
- tab-level loading

## Error
- inline retry state per tab when possible
