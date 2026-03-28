"use client";

type Props = {
  /** Count of list rows classified as trusted intelligence (CI + local-dev). */
  trustedListCount: number;
};

export function SystemTestsDataQualityBanner(props: Props) {
  const { trustedListCount } = props;

  if (trustedListCount >= 2) {
    return null;
  }

  const message =
    trustedListCount === 1
      ? "Only one trusted run is available; historical intelligence is limited."
      : "No trusted runs are available; historical intelligence is hidden.";

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
      <p className="font-semibold text-amber-100">Data quality</p>
      <p className="mt-2 text-amber-100/90">{message}</p>
    </div>
  );
}
