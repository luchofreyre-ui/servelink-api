/**
 * Public booking home-size ladder. `value` is a representative sqft (300–99999)
 * sent to the estimator/API; `label` is customer-facing.
 */
export type BookingHomeSizeRangeOption = {
  value: string;
  label: string;
};

export const BOOKING_HOME_SIZE_RANGE_OPTIONS: BookingHomeSizeRangeOption[] = [
  { value: "400", label: "300–499 sq ft" },
  { value: "600", label: "500–699 sq ft" },
  { value: "800", label: "700–899 sq ft" },
  { value: "1000", label: "900–1,099 sq ft" },
  { value: "1200", label: "1,100–1,299 sq ft" },
  { value: "1400", label: "1,300–1,499 sq ft" },
  { value: "1650", label: "1,500–1,799 sq ft" },
  { value: "2000", label: "1,800–2,199 sq ft" },
  { value: "2400", label: "2,200–2,599 sq ft" },
  { value: "2800", label: "2,600–2,999 sq ft" },
  { value: "3250", label: "3,000–3,499 sq ft" },
  { value: "3750", label: "3,500–3,999 sq ft" },
  { value: "4500", label: "4,000–4,999 sq ft" },
  { value: "5500", label: "5,000–5,999 sq ft" },
  { value: "6500", label: "6,000–6,999 sq ft" },
  { value: "7500", label: "7,000–7,999 sq ft" },
  { value: "8000", label: "8,000+ sq ft" },
];

const valueToLabel = new Map(
  BOOKING_HOME_SIZE_RANGE_OPTIONS.map((o) => [o.value, o.label]),
);

export function getBookingHomeSizeRangeLabel(storedValue: string): string {
  const v = String(storedValue ?? "").trim();
  return valueToLabel.get(v) ?? v;
}
