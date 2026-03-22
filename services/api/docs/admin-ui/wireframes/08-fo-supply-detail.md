# FO Supply Detail

## Route
- `/admin/supply/fo/:foId`

## Purpose
Per-FO predictive supply detail and override view.

## Permissions
- supply.read
- owner for override editing

## Primary APIs
To be implemented by supply backend when ready.

## Page layout

```text
Header
- Title: FO Supply Detail
- Subtitle: FO name + territory
- Actions: Edit Override

Row 1
- FO Summary
- Supply Health Score

Row 2
- Runway by Category

Row 3
- Predicted Demand (7 / 14 / 30 days)

Row 4
- Overrides
- Shipment History / Activity
```

## Main sections
- FO summary
- runway by category
- predicted demand horizon
- FO-specific overrides
- shipment history
- anomaly history

## Actions
- edit FO override
- view shipment recommendations
- inspect recent rule influence
