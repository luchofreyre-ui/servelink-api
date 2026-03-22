# Admin UI Auth and Session Rules

## Admin auth model

The Admin UI uses authenticated admin-only access.

Current backend rules:
- 401 = unauthenticated
- 403 = authenticated but not allowed

Frontend behavior must preserve this distinction.

---

## Session behavior

### On missing or expired auth
If the backend returns 401:
- clear local admin session state
- redirect to admin login
- show a lightweight session-expired message if appropriate

### On forbidden access
If the backend returns 403:
- do not log the user out
- show a "You do not have access to this area" screen or inline state
- hide or disable future access points where practical

---

## Token/storage rule

Use one consistent session approach for the admin frontend.
Do not mix localStorage/sessionStorage/cookie strategies ad hoc.

The chosen implementation should support:
- route protection
- silent revalidation if applicable
- central logout handling

---

## Route protection

The following route groups require admin auth:
- `/admin`
- `/admin/exceptions`
- `/admin/bookings/:bookingId`
- `/admin/dispatch-config`
- `/admin/activity`
- `/admin/anomalies`

Unauthenticated users should never see shell navigation for admin routes.

---

## Capability awareness

Even though all current admins have full permissions, the frontend should be built as if capabilities can differ later.

Examples:
- config publish buttons can be capability-gated
- rollback actions can be capability-gated
- anomaly write actions can be capability-gated

This should be done with a central permission check helper, not scattered ad hoc logic.

---

## Logout behavior

Logout should:
- clear client auth state
- clear cached admin API data if needed
- redirect to admin login

---

## Error boundaries

If a protected route fails due to session state uncertainty:
- prefer redirect to login for 401
- prefer forbidden state for 403
- prefer generic error boundary for 5xx
