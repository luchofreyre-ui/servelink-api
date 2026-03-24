import { BookingSectionCard } from "../BookingSectionCard";
import { BookingSelectField } from "./BookingSelectField";
import { BookingTextField } from "./BookingTextField";
import type { BookingFlowState } from "./bookingFlowTypes";

type BookingStepHomeDetailsProps = {
  state: BookingFlowState;
  onChange: (patch: Partial<BookingFlowState>) => void;
};

export function BookingStepHomeDetails({
  state,
  onChange,
}: BookingStepHomeDetailsProps) {
  return (
    <BookingSectionCard
      eyebrow="Step 2"
      title="Tell us about your home"
      body="This helps us scope your service correctly and avoid surprises."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <BookingTextField
          label="Home Size"
          value={state.homeSize}
          onChange={(value) => onChange({ homeSize: value })}
          placeholder="Enter square footage (e.g. 2,200 sq ft)"
        />

        <BookingSelectField
          label="Bedrooms"
          value={state.bedrooms}
          onChange={(value) => onChange({ bedrooms: value })}
          options={[
            "",
            "1 bedroom",
            "2 bedrooms",
            "3 bedrooms",
            "4 bedrooms",
            "5+ bedrooms",
          ]}
          placeholder="Select bedrooms"
        />

        <BookingSelectField
          label="Bathrooms"
          value={state.bathrooms}
          onChange={(value) => onChange({ bathrooms: value })}
          options={[
            "",
            "1 bathroom",
            "2 bathrooms",
            "3 bathrooms",
            "4+ bathrooms",
          ]}
          placeholder="Select bathrooms"
        />

        <BookingSelectField
          label="Pets (optional)"
          value={state.pets}
          onChange={(value) => onChange({ pets: value })}
          options={[
            "",
            "No pets",
            "One dog",
            "One cat",
            "Multiple pets",
          ]}
          placeholder="Tell us about pets (optional)"
          helper="This helps us plan safely, but you can skip it."
        />
      </div>
    </BookingSectionCard>
  );
}
