import Link from "next/link";
import { MarketingHeader } from "./MarketingHeader";
import { BookingField } from "./BookingField";
import { BookingFlowProgress } from "./BookingFlowProgress";
import { BookingOptionCard } from "./BookingOptionCard";
import { BookingSectionCard } from "./BookingSectionCard";

const steps = [
  { id: 1, label: "Visit type" },
  { id: 2, label: "Your home" },
  { id: 3, label: "Visit address" },
  { id: 4, label: "Review & estimate" },
];

const serviceOptions = [
  {
    title: "Recurring Home Cleaning",
    body: "For clients who want an ongoing standard of presentation and less household management stress.",
    meta: "Most common long-term fit",
  },
  {
    title: "Deep Cleaning",
    body: "For first visits, seasonal resets, or homes that need more than light maintenance.",
    meta: "Best starting point",
  },
  {
    title: "Move-In / Move-Out",
    body: "For transitions, handoffs, listing prep, and property-ready presentation.",
    meta: "Best for transitions",
  },
];

const frequencyOptions = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "One-Time",
];

const timeOptions = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Friday",
  "Saturday",
];

export function BookingFlowShellPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <MarketingHeader />

      <main>
        <section className="border-b border-[#C9B27C]/14">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
            <div className="max-w-4xl">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                Booking flow shell
              </p>
              <h1 className="mt-4 font-[var(--font-poppins)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#0F172A] md:text-6xl">
                A premium booking experience should feel guided, calm, and easy to complete.
              </h1>
              <p className="mt-6 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569] md:text-xl">
                This shell is the structural direction for the future live booking flow. It
                is intentionally simple, premium, and high-trust.
              </p>
            </div>

            <div className="mt-10">
              <BookingFlowProgress currentStep={1} steps={steps} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <BookingSectionCard
                eyebrow="Step 1"
                title="Choose the right service"
                body="The page should help the client select confidently without feeling overloaded."
              >
                <div className="grid gap-5">
                  {serviceOptions.map((option, index) => (
                    <BookingOptionCard
                      key={option.title}
                      title={option.title}
                      body={option.body}
                      meta={option.meta}
                      selected={index === 1}
                    />
                  ))}
                </div>
              </BookingSectionCard>

              <BookingSectionCard
                eyebrow="Home details"
                title="Gather the information needed to scope the visit clearly"
                body="The visual treatment should feel thoughtful and premium, not like a generic lead form."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <BookingField label="Home Size" value="2,200 sq ft" />
                  <BookingField label="Bedrooms" value="3 bedrooms" />
                  <BookingField label="Bathrooms" value="2 bathrooms" />
                  <BookingField
                    label="Pets"
                    value="One dog"
                    helper="Use calm helper text to reduce uncertainty."
                  />
                </div>
              </BookingSectionCard>

              <BookingSectionCard
                eyebrow="Scheduling"
                title="Guide the client into a clear, high-confidence scheduling choice"
                body="This stage should feel structured and predictable, which increases trust before payment or confirmation."
              >
                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <p className="mb-4 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                      Preferred frequency
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {frequencyOptions.map((option, index) => (
                        <BookingOptionCard
                          key={option}
                          title={option}
                          body="Selected as a presentation example for the final booking UI."
                          selected={index === 1}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                      Preferred timing
                    </p>
                    <div className="grid gap-4">
                      {timeOptions.map((option, index) => (
                        <BookingOptionCard
                          key={option}
                          title={option}
                          body="Use polished scheduling options instead of cluttered date-picker-first UX."
                          selected={index === 0}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </BookingSectionCard>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Booking summary
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  Deep Cleaning
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
                    <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-[#475569]">
                      Frequency
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      Bi-Weekly
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
                    <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-[#475569]">
                      Home Profile
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      3 bed · 2 bath · 2,200 sq ft
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
                    <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-[#475569]">
                      Preferred Timing
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      Weekday Morning
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-[#0D9488]/18 bg-[#0D9488] p-5 text-white shadow-[0_14px_40px_rgba(13,148,136,0.16)]">
                  <p className="font-[var(--font-manrope)] text-xs uppercase tracking-[0.16em] text-white/75">
                    Premium booking standard
                  </p>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-7 text-white">
                    The booking flow should feel as polished as the service itself. This
                    right-hand summary keeps decisions visible and increases completion confidence.
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button className="rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]">
                    Continue to Scheduling
                  </button>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
                  >
                    Back to Services
                  </Link>
                </div>
              </section>

              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Why this matters
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-white">
                  Premium conversion is not just about aesthetics.
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-white/75">
                  The booking shell sets the tone for trust, clarity, and perceived service
                  quality before checkout is ever completed.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
