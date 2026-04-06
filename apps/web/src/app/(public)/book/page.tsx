import { EstimatorForm } from "@/components/booking/EstimatorForm";

export default function BookingPage() {
  return (
    <main className="min-h-screen px-6 py-10">

      <h1 className="text-2xl font-semibold mb-6">
        Book a Cleaning
      </h1>

      <EstimatorForm />

    </main>
  );
}
