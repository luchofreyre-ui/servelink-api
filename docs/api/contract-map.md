# Servelink Clean v1 — API Contract Map

## Conventions

- **Base URL**: `/api/v1`
- **Auth**: Bearer JWT
- **Idempotency**: Use `Idempotency-Key` header for create/payment actions
- **Pagination**: `?limit=50&cursor=...`
- **Timestamps**: ISO 8601 UTC
- **Money**: integer cents (`amount_cents`)
- **Location**: `{ lat, lon, accuracy_m }`

---

## 1) Auth & Identity

### POST /auth/register

Create account (customer default).

**Body:**
```json
{
  "email": "",
  "phone": "",
  "password": "",
  "role": "customer"
}
```

**Response:** `201`
```json
{
  "user_id": "usr_...",
  "token": "jwt...",
  "refresh_token": "..."
}
```

### POST /auth/login

**Body:**
```json
{
  "email": "",
  "password": ""
}
```

### POST /auth/refresh

**Body:**
```json
{
  "refresh_token": "..."
}
```

### POST /auth/logout

Revokes refresh token.

### GET /me

Returns current user + role + permissions.

---

## 2) Profiles

### GET /customers/me

Customer profile.

### PATCH /customers/me

Update profile fields.

**Body:**
```json
{
  "first_name": "",
  "last_name": "",
  "default_phone": "",
  "preferences": {
    "pets": true
  }
}
```

### GET /fos/me

FO profile (FO only).

### PATCH /fos/me

Update FO profile (non-sensitive).

**Body:**
```json
{
  "display_name": "",
  "bio": "",
  "service_radius_miles": 15,
  "photo_url": "..."
}
```

### POST /fos/apply

FO application intake.

**Body:**
```json
{
  "legal_name": "",
  "phone": "",
  "city": "",
  "services": ["cleaning"],
  "experience_years": 3,
  "equipment": ["vacuum", "mop"],
  "insurance_status": "in_progress"
}
```

**Response:** `201`
```json
{
  "fo_id": "fo_...",
  "status": "applied"
}
```

### POST /fos/documents

Upload ID/insurance (pre-signed URL flow recommended).

**Body:**
```json
{
  "type": "insurance",
  "file_name": "policy.pdf",
  "mime": "application/pdf"
}
```

**Response:** `200`
```json
{
  "upload_url": "https://...",
  "document_id": "doc_..."
}
```

---

## 3) Addresses & Properties

### GET /properties

List customer properties.

### POST /properties

Create property.

**Body:**
```json
{
  "label": "Home",
  "address_line1": "",
  "city": "",
  "state": "OK",
  "zip": "",
  "instructions": "Gate code 1234",
  "pets": true
}
```

### PATCH /properties/{property_id}

Update property details.

---

## 4) Pricing (Fixed Hourly)

### GET /pricing/cleaning

Returns fixed hourly rate + rules.

**Response:** `200`
```json
{
  "hourly_rate_cents": 6500,
  "billing_increment_minutes": 15,
  "late_grace_minutes": 120,
  "exclusions": [
    "biohazards",
    "mold",
    "construction_debris",
    "hoarding",
    "exterior_windows",
    "heavy_furniture"
  ]
}
```

---

## 5) Booking Flow

### POST /bookings

Create booking + payment authorization intent.

**Body:**
```json
{
  "property_id": "prop_...",
  "scheduled_start": "2026-02-10T15:00:00Z",
  "estimated_hours": 3,
  "notes": "Focus on kitchen + bathrooms",
  "access": "lockbox",
  "pets": true
}
```

**Response:** `201`
```json
{
  "booking_id": "bok_...",
  "status": "pending_dispatch",
  "payment_intent_id": "pi_...",
  "client_secret": "...stripe..."
}
```

### GET /bookings/{booking_id}

Booking details including assigned FO (if any), status, pricing rules.

### POST /bookings/{booking_id}/cancel

**Body:**
```json
{
  "reason": "change_of_plans"
}
```

### POST /bookings/{booking_id}/reschedule

**Body:**
```json
{
  "new_start": "2026-02-10T17:00:00Z"
}
```

---

## 6) Dispatch & Offers (Auto Dispatch + Customer Accept/Deny)

### POST /dispatch/{booking_id}/run

Admin/system triggers dispatch (cron/worker normally).

**Response:** `200`
```json
{
  "offer_id": "off_...",
  "candidate_fo_ids": ["fo_1", "fo_2"],
  "status": "offered"
}
```

### GET /bookings/{booking_id}/offer

Customer views current offer candidate.

**Response:** `200`
```json
{
  "offer_id": "off_...",
  "fo": {
    "fo_id": "fo_...",
    "display_name": "Jordan",
    "photo_url": "...",
    "rating_avg": 4.8,
    "jobs_completed": 312
  },
  "expires_at": "2026-02-10T14:40:00Z",
  "interview_enabled": true
}
```

### POST /offers/{offer_id}/customer-decision

Customer accept/deny.

**Body (accept):**
```json
{
  "decision": "accept"
}
```

**Body (deny):**
```json
{
  "decision": "deny",
  "reason": "prefer_more_experience"
}
```

**Response:** `200`
```json
{
  "booking_id": "bok_...",
  "status": "assigned"
}
```

*(or triggers next offer if denied)*

### POST /offers/{offer_id}/fo-decision

FO accept/decline (offer timer enforced).

**Body:**
```json
{
  "decision": "accept"
}
```

---

## 7) Messaging (Customer ↔ FO via Platform)

### GET /conversations?booking_id=...

Returns conversation id.

### POST /conversations/{conversation_id}/messages

**Body:**
```json
{
  "type": "text",
  "text": "Hi—can you focus on baseboards?"
}
```

### POST /conversations/{conversation_id}/attachments

Pre-signed upload for images.

*Optional v1: implement text-only first; add attachments in v1.1.*

---

## 8) Job Execution (GPS Arrival/Departure + Timer)

### POST /jobs/{booking_id}/arrive

FO check-in (GPS required).

**Body:**
```json
{
  "location": {
    "lat": 36.1540,
    "lon": -95.9928,
    "accuracy_m": 12
  }
}
```

**Response:** `200`
```json
{
  "job_id": "job_...",
  "status": "in_progress",
  "arrived_at": "2026-02-10T15:03:00Z"
}
```

### POST /jobs/{job_id}/heartbeat

Optional: periodic GPS pings (anti-spoof).

**Body:**
```json
{
  "location": {
    "lat": 36.1541,
    "lon": -95.9927,
    "accuracy_m": 10
  }
}
```

### POST /jobs/{job_id}/depart

FO checkout.

**Body:**
```json
{
  "location": {
    "lat": 36.1542,
    "lon": -95.9929,
    "accuracy_m": 15
  }
}
```

**Response:** `200`
```json
{
  "status": "completed_pending_review",
  "departed_at": "2026-02-10T17:02:00Z",
  "billable_minutes": 120,
  "billable_minutes_rounded": 120
}
```

### GET /jobs/{job_id}

Returns full timeline, GPS events summary, customer-visible timer state.

---

## 9) Post-Service: Rating & Review

### POST /jobs/{job_id}/rating

**Body:**
```json
{
  "stars": 5,
  "comment": "Great job—very thorough."
}
```

### GET /fos/{fo_id}/public

Public FO profile for customer preview / website listing.

---

## 10) Issues, Rework, Refunds

### POST /jobs/{job_id}/issues

Create issue ticket.

**Body:**
```json
{
  "category": "quality",
  "areas": [
    {
      "name": "Kitchen counters",
      "notes": "Still greasy near stove"
    }
  ],
  "requested_resolution": "touch_up"
}
```

**Response:** `201`
```json
{
  "issue_id": "iss_...",
  "status": "awaiting_photos"
}
```

### POST /issues/{issue_id}/photos

Enforce: 4 photos per area (2 close, 2 wide).

**Body:**
```json
{
  "area_name": "Kitchen counters",
  "photos": [
    {
      "type": "close",
      "file_name": "c1.jpg",
      "mime": "image/jpeg"
    },
    {
      "type": "close",
      "file_name": "c2.jpg",
      "mime": "image/jpeg"
    },
    {
      "type": "wide",
      "file_name": "w1.jpg",
      "mime": "image/jpeg"
    },
    {
      "type": "wide",
      "file_name": "w2.jpg",
      "mime": "image/jpeg"
    }
  ]
}
```

**Response:** `200` returns upload URLs + photo ids.

### POST /issues/{issue_id}/offer-touchup

Admin offers touch-up.

**Body:**
```json
{
  "fo_id": "fo_...",
  "deadline": "2026-02-12T23:59:59Z"
}
```

### POST /issues/{issue_id}/customer-touchup-decision

**Body:**
```json
{
  "decision": "accept"
}
```

### POST /issues/{issue_id}/refund-decision (Admin)

All refunds reviewed; full refunds rare; abusive photos => rework only.

**Body:**
```json
{
  "decision": "partial_refund",
  "refund_amount_cents": 3250,
  "reason_code": "quality_verified",
  "notes": "Partial refund approved after review."
}
```

---

## 11) Early Termination Logic (Customer ends job early)

### POST /jobs/{job_id}/end-early (Admin or Customer Support)

Records early termination reason and locks minutes.

**Body:**
```json
{
  "ended_by": "customer",
  "reason": "asked_fo_to_leave"
}
```

### POST /jobs/{job_id}/refund-after-replacement (Admin)

If subsequent FO completes full service, refund may be issued and deducted from first FO.

**Body:**
```json
{
  "replacement_job_id": "job_...",
  "refund_amount_cents": 6500,
  "deduct_from_fo_id": "fo_original"
}
```

*Implementation note: use ledger adjustments; do not mutate old payouts.*

---

## 12) Admin: Overrides, Enforcement, Visibility

### GET /admin/jobs?status=...

Job queue.

### GET /admin/issues?status=pending_review

Refund/issue queue.

### POST /admin/fos/{fo_id}/pause

**Body:**
```json
{
  "reason_code": "performance_at_risk",
  "notes": "Score < 60; pending review."
}
```

### POST /admin/fos/{fo_id}/offboard

**Body:**
```json
{
  "reason_code": "job_abandonment",
  "notes": "Undocumented walk-off."
}
```

### POST /admin/bookings/{booking_id}/reassign

Reassign mid-stream or pre-start.

**Body:**
```json
{
  "reason_code": "no_show",
  "force": true
}
```

### PATCH /admin/fos/{fo_id}/visibility

Manual override if needed.

**Body:**
```json
{
  "visibility_multiplier": 0.5
}
```

---

## 13) Performance & Scoring Endpoints

### GET /fos/me/performance

Returns score + breakdown + tier.

**Response:** `200`
```json
{
  "overall_score": 87,
  "tier": "preferred",
  "metrics": {
    "rating_avg_last20": 4.7,
    "rework_rate_last20": 0.05,
    "on_time_pct_last20": 0.96,
    "completion_pct_last20": 0.99
  },
  "points": {
    "rating": 35,
    "rework": 30,
    "on_time": 17,
    "completion": 10
  }
}
```

### GET /admin/fos/{fo_id}/performance

Admin view plus trend history.

---

## 14) Payouts & Ledger

### GET /fos/me/payouts

List payout batches.

### GET /fos/me/ledger

Line items: earnings, platform fee, deductions, refunds.

### POST /admin/payouts/run

Runs next-business-day payout batch.

### POST /admin/ledger/adjust

Manual adjustment (rare, audited).

**Body:**
```json
{
  "fo_id": "fo_...",
  "amount_cents": -6500,
  "type": "deduction",
  "reason_code": "refund_deducted_original_fo",
  "reference_id": "iss_..."
}
```

---

## 15) Notifications

### GET /notifications

List notifications.

### POST /admin/notifications/test

Test email/sms/push templates.

---

## 16) Webhooks (External)

### POST /webhooks/stripe

Stripe payment events:

- `payment_intent.succeeded`
- `charge.refunded`
- `payout.paid` (if using Stripe Connect)
