"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateEstimate } from "@/lib/estimator/estimateEngine";
import { FRANCHISE_OWNER_PROFILES } from "@/lib/booking/franchiseOwners";
import { buildEstimateInputForApi } from "@/lib/bookings/estimateInputFromEstimator";
import type { ProblemType, SurfaceType } from "@/lib/estimator/estimateEngine";

export function EstimatorForm() {
  const router = useRouter();

  const [sqft, setSqft] = useState(1200);
  const [surface, setSurface] = useState<SurfaceType>("whole_home");
  const [problem, setProblem] = useState<ProblemType>("standard_clean");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedFoId, setSelectedFoId] = useState(FRANCHISE_OWNER_PROFILES[0]?.id ?? "");
  const [result, setResult] = useState<ReturnType<typeof generateEstimate> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const estimateSnapshot = useMemo(() => {
    if (!result) return null;

    return {
      ...result,
      squareFootage: sqft,
      surface,
      problem,
    };
  }, [problem, result, sqft, surface]);

  function handleEstimate(e: React.FormEvent) {
    e.preventDefault();

    const estimate = generateEstimate({
      squareFootage: sqft,
      surface,
      problem,
    });

    setResult(estimate);
  }

  async function handleBooking() {
    if (!estimateSnapshot) return;
    if (!customerName.trim() || !customerEmail.trim()) return;

    setSubmitting(true);

    try {
      const { createBooking } = await import("@/lib/bookings/bookingClient");
      const record = await createBooking({
        estimateInput: buildEstimateInputForApi({
          sqft,
          surface,
          problem,
        }),
        note: `Customer: ${customerName.trim()} <${customerEmail.trim()}>`,
      });

      const price =
        typeof record.priceTotal === "number" && Number.isFinite(record.priceTotal)
          ? record.priceTotal
          : Number(record.quotedTotal ?? 0);

      router.push(
        `/book/confirmation?bookingId=${record.id}&price=${price}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Get Your Cleaning Estimate</h1>

      <form onSubmit={handleEstimate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Square footage</label>
          <input
            type="number"
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Square footage"
            min={100}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Service area focus</label>
          <select
            value={surface}
            onChange={(e) => setSurface(e.target.value as SurfaceType)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="whole_home">Whole Home</option>
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="living_room">Living Room</option>
            <option value="bedroom">Bedroom</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Condition level</label>
          <select
            value={problem}
            onChange={(e) => setProblem(e.target.value as ProblemType)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="light_clean">Light Clean</option>
            <option value="standard_clean">Standard Clean</option>
            <option value="deep_clean">Deep Clean</option>
            <option value="heavy_buildup">Heavy Buildup</option>
          </select>
        </div>

        <button className="rounded-xl bg-slate-900 px-4 py-3 text-white">
          Calculate
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 p-5">
          <p>
            <strong>Estimated price:</strong> ${result.finalPrice}
          </p>
          <p className="mt-1">
            <strong>Estimated time:</strong> {result.durationHours} hrs
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Your name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Your email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Choose your franchise owner</label>
              <select
                value={selectedFoId}
                onChange={(e) => setSelectedFoId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                {FRANCHISE_OWNER_PROFILES.map((fo) => (
                  <option key={fo.id} value={fo.id}>
                    {fo.name} — {fo.city} — {fo.rating}★ ({fo.reviewCount} reviews)
                  </option>
                ))}
              </select>
            </div>

            <button
              className="rounded-xl bg-emerald-600 px-4 py-3 text-white disabled:opacity-60"
              onClick={handleBooking}
              disabled={submitting || !customerName.trim() || !customerEmail.trim()}
              type="button"
            >
              {submitting ? "Submitting booking..." : "Continue Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
