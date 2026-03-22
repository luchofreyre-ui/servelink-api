/**
 * Subtle freshness signal for SEO. Use on key pages to avoid stale-page signals.
 */

type PageFreshnessProps = {
  text?: string;
};

const DEFAULT_TEXT = "Coverage updated for Tulsa-area service availability.";

export function PageFreshness({ text = DEFAULT_TEXT }: PageFreshnessProps) {
  return (
    <p className="mt-6 text-sm text-gray-500" aria-hidden="true">
      {text}
    </p>
  );
}

export function LastUpdated({ date }: { date: string }) {
  return (
    <p className="mt-6 text-sm text-gray-500" aria-hidden="true">
      Last updated: {date}
    </p>
  );
}
