"use client";

import Link from "next/link";
import type { SystemTestResolutionPreview } from "@/types/systemTestResolution";
import { SystemTestsBadge } from "./SystemTestsBadge";

export function getResolutionPreviewSummary(
  preview: SystemTestResolutionPreview | null,
): string | null {
  if (!preview?.hasResolution) {
    return null;
  }

  return preview.topRecommendationSummary ?? preview.diagnosisSummary ?? null;
}

export type SystemTestsResolutionPreviewProps = {
  preview: SystemTestResolutionPreview | null;
  href?: string;
  compact?: boolean;
  emptyLabel?: string;
};

export function SystemTestsResolutionPreview(props: SystemTestsResolutionPreviewProps) {
  const { preview, href, compact, emptyLabel = "No fix preview" } = props;
  const textSize = compact ? "text-[11px]" : "text-xs";
  const gap = compact ? "gap-1" : "gap-1.5";

  if (!preview || !preview.hasResolution) {
    return (
      <p className={`${textSize} text-white/45`} data-testid="system-tests-resolution-preview-empty">
        {emptyLabel}
      </p>
    );
  }

  const summary = getResolutionPreviewSummary(preview);
  const extraRecs = preview.recommendationCount > 1 ? preview.recommendationCount - 1 : 0;

  return (
    <div className={`flex flex-col ${gap}`} data-testid="system-tests-resolution-preview">
      <div className={`flex flex-wrap items-center ${gap}`}>
        {preview.category ? (
          <SystemTestsBadge variant="stable" className="!normal-case">
            {preview.category.replace(/_/g, " ")}
          </SystemTestsBadge>
        ) : null}
        {preview.confidenceLabel ? (
          <SystemTestsBadge variant="stable" className="!normal-case">
            {preview.confidenceLabel}
          </SystemTestsBadge>
        ) : null}
      </div>
      {summary ? (
        <p
          className={`${textSize} leading-snug text-white/75 line-clamp-2`}
          data-testid="system-tests-resolution-preview-summary"
        >
          {summary}
        </p>
      ) : (
        <p className={`${textSize} text-white/45`} data-testid="system-tests-resolution-preview-no-summary">
          —
        </p>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${textSize}`}>
        {extraRecs > 0 ? (
          <span className="text-white/40" data-testid="system-tests-resolution-preview-more">
            +{extraRecs} more
          </span>
        ) : null}
        {href ? (
          <Link
            href={href}
            className="text-sky-300/90 hover:text-sky-200"
            data-testid="system-tests-resolution-preview-link"
          >
            View fix
          </Link>
        ) : null}
      </div>
    </div>
  );
}
