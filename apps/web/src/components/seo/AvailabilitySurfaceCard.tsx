import type { AvailabilitySurface } from "../../content/platformSurfaces";

type AvailabilitySurfaceCardProps = {
  availability: AvailabilitySurface;
};

export function AvailabilitySurfaceCard({ availability }: AvailabilitySurfaceCardProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">Availability</h2>
      <p className="mt-2 text-gray-700">{availability.nextAvailabilityLabel}</p>
    </section>
  );
}
