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
      title="Gather the information needed to scope the visit clearly"
      body="The visual treatment should feel thoughtful and premium, not like a generic lead form."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <BookingTextField
          label="Home Size"
          value={state.homeSize}
          onChange={(value) => onChange({ homeSize: value })}
          placeholder="2,200 sq ft"
        />

        <BookingSelectField
          label="Bedrooms"
          value={state.bedrooms}
          onChange={(value) => onChange({ bedrooms: value })}
          options={[
            "1 bedroom",
            "2 bedrooms",
            "3 bedrooms",
            "4 bedrooms",
            "5+ bedrooms",
          ]}
        />

        <BookingSelectField
          label="Bathrooms"
          value={state.bathrooms}
          onChange={(value) => onChange({ bathrooms: value })}
          options={[
            "1 bathroom",
            "2 bathrooms",
            "3 bathrooms",
            "4+ bathrooms",
          ]}
        />

        <BookingSelectField
          label="Pets"
          value={state.pets}
          onChange={(value) => onChange({ pets: value })}
          options={[
            "No pets",
            "One dog",
            "One cat",
            "Multiple pets",
          ]}
          helper="Use calm helper text to reduce uncertainty."
        />
      </div>
    </BookingSectionCard>
  );
}
