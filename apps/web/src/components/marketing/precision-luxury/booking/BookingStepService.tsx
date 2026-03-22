import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import { bookingServiceCatalog } from "./bookingServiceCatalog";

type BookingStepServiceProps = {
  serviceId: string;
  onSelect: (serviceId: string) => void;
};

export function BookingStepService({
  serviceId,
  onSelect,
}: BookingStepServiceProps) {
  return (
    <BookingSectionCard
      eyebrow="Step 1"
      title="Choose the right service"
      body="The page should help the client select confidently without feeling overloaded."
    >
      <div className="grid gap-5">
        {bookingServiceCatalog.map((option) => (
          <div key={option.id} onClick={() => onSelect(option.id)}>
            <BookingOptionCard
              title={option.title}
              body={option.shortDescription}
              meta={option.meta}
              selected={serviceId === option.id}
            />
          </div>
        ))}
      </div>
    </BookingSectionCard>
  );
}
