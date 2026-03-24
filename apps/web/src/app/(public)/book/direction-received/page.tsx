import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = {
  title: "We received your booking direction | Servelink",
  description:
    "Your service request details were received. Our team will use this to follow up with next steps.",
};

export default function BookingDirectionReceivedPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />

      <main>
        <section className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            Booking direction
          </p>
          <h1 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-[#0F172A] md:text-5xl">
            We received your booking direction
          </h1>
          <p className="mt-6 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
            Thank you. This is{" "}
            <strong className="font-semibold text-[#0F172A]">
              not a confirmed appointment yet
            </strong>
            — we captured your preferences so our team can match you with the
            right service plan and availability.
          </p>

          <div className="mt-10 space-y-6 rounded-[28px] border border-[#C9B27C]/18 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <div>
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                What happens next
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                We&apos;ll review your service type, home profile, and timing
                preferences. Someone from Servelink will reach out with
                confirmation options, pricing context, and any follow-up
                questions—usually within one business day.
              </p>
            </div>
            <div>
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Contact
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#334155]">
                If you included contact details elsewhere on the site, we may
                use those. You can always reply to our message or return to the
                booking flow to adjust your direction before anything is
                finalized.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
            >
              Back to booking
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-3.5 font-[var(--font-manrope)] text-sm font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
            >
              Browse services
            </Link>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
