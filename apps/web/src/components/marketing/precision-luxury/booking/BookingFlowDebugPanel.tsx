"use client";

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

export type BookingHomeRequirementDebugRow = {
  field: string;
  required: boolean;
  rendered: boolean;
  hasValue: boolean;
  value: JsonLike;
  status: "pass" | "fail" | "unknown";
  note?: string | null;
};

export type BookingFlowDebugState = {
  flowVersion: string;
  pathname?: string | null;

  currentStep?: string | null;
  orderedSteps?: string[];
  reachableSteps?: string[];
  nextStepCandidate?: string | null;
  previousStepCandidate?: string | null;

  canContinue?: boolean | null;
  stepError?: string | null;

  isLoadingEstimate?: boolean | null;
  estimateError?: string | null;
  estimateReady?: boolean | null;
  estimateStale?: boolean | null;
  previewFetchCompleted?: boolean | null;
  previewRequestKey?: string | null;
  snapshotRequestKey?: string | null;

  decisionEligible?: boolean | null;
  recurringEligible?: boolean | null;
  reviewReady?: boolean | null;

  selectedFrequency?: string | null;
  selectedDecision?: string | null;
  selectedProgram?: string | null;
  zip?: string | null;
  homeSize?: string | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;

  pricePreview?: JsonLike;
  estimatePipeline?: JsonLike;
  formSnapshot?: JsonLike;
  payloadSnapshot?: JsonLike;

  homeRequirements?: BookingHomeRequirementDebugRow[];
  homeRenderedFieldIds?: string[];
  homeValidationFailure?: string | null;

  previewPayloadSnapshot?: JsonLike;
  previewResponseSnapshot?: JsonLike;
  submitPayloadSnapshot?: JsonLike;
  estimateSnapshotPresent?: boolean | null;
  estimateSnapshotStepGuard?: boolean | null;
  confirmBlockedReason?: string | null;
  estimateFactorsPresentInPreviewPayload?: boolean | null;
  estimateFactorsPresentInSubmitPayload?: boolean | null;
  previewRequestAttempted?: boolean | null;
  previewResponseOk?: boolean | null;
  previewResponseStatus?: number | null;
  previewSource?: string | null;
  reviewNextAttempts?: JsonLike;
};

function pretty(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function Row(props: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-white/10 py-1">
      <div className="font-medium text-white/70">{props.label}</div>
      <div className="break-words text-white">{String(props.value ?? "null")}</div>
    </div>
  );
}

export function BookingFlowDebugPanel({
  state,
}: {
  state: BookingFlowDebugState;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[min(560px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-red-400 bg-black/95 shadow-2xl">
      <div className="border-b border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white">
        Booking Debug Panel — {state.flowVersion}
      </div>

      <div className="max-h-[75vh] overflow-y-auto p-4 text-xs">
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Core State</div>
          <Row label="pathname" value={state.pathname} />
          <Row label="currentStep" value={state.currentStep} />
          <Row label="orderedSteps" value={(state.orderedSteps ?? []).join(", ")} />
          <Row label="reachableSteps" value={(state.reachableSteps ?? []).join(", ")} />
          <Row label="nextStepCandidate" value={state.nextStepCandidate} />
          <Row label="previousStepCandidate" value={state.previousStepCandidate} />
          <Row label="canContinue" value={state.canContinue} />
          <Row label="stepError" value={state.stepError} />
          <Row label="isLoadingEstimate" value={state.isLoadingEstimate} />
          <Row label="estimateError" value={state.estimateError} />
          <Row label="estimateReady" value={state.estimateReady} />
          <Row label="estimateStale" value={state.estimateStale} />
          <Row label="previewFetchCompleted" value={state.previewFetchCompleted} />
          <Row label="previewRequestKey" value={state.previewRequestKey} />
          <Row label="snapshotRequestKey" value={state.snapshotRequestKey} />
          <Row label="estimateSnapshotPresent" value={state.estimateSnapshotPresent} />
          <Row label="estimateSnapshotStepGuard" value={state.estimateSnapshotStepGuard} />
          <Row label="confirmBlockedReason" value={state.confirmBlockedReason} />
          <Row label="previewRequestAttempted" value={state.previewRequestAttempted} />
          <Row label="previewResponseOk" value={state.previewResponseOk} />
          <Row label="previewResponseStatus" value={state.previewResponseStatus} />
          <Row label="previewSource" value={state.previewSource} />
          <Row
            label="estimateFactorsInPreviewPayload"
            value={state.estimateFactorsPresentInPreviewPayload}
          />
          <Row
            label="estimateFactorsInSubmitPayload"
            value={state.estimateFactorsPresentInSubmitPayload}
          />
          <Row label="decisionEligible" value={state.decisionEligible} />
          <Row label="recurringEligible" value={state.recurringEligible} />
          <Row label="reviewReady" value={state.reviewReady} />
          <Row label="selectedFrequency" value={state.selectedFrequency} />
          <Row label="selectedDecision" value={state.selectedDecision} />
          <Row label="selectedProgram" value={state.selectedProgram} />
          <Row label="zip" value={state.zip} />
          <Row label="homeSize" value={state.homeSize} />
          <Row label="bedrooms" value={state.bedrooms} />
          <Row label="bathrooms" value={state.bathrooms} />
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Home Step Truth</div>

          <Row label="homeValidationFailure" value={state.homeValidationFailure} />
          <Row
            label="homeRenderedFieldIds"
            value={(state.homeRenderedFieldIds ?? []).join(", ")}
          />

          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.homeRequirements)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Price Preview</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.pricePreview)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Estimate Pipeline</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.estimatePipeline)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Form Snapshot</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.formSnapshot)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Payload Snapshot</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.payloadSnapshot)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Preview Payload Snapshot</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.previewPayloadSnapshot)}
          </pre>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Preview Response Snapshot</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.previewResponseSnapshot)}
          </pre>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Submit Payload Snapshot</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/90">
            {pretty(state.submitPayloadSnapshot)}
          </pre>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Review Next Attempts</div>
          <pre
            data-testid="booking-debug-review-next-attempts"
            className="overflow-x-auto whitespace-pre-wrap text-white/90"
          >
            {pretty(state.reviewNextAttempts)}
          </pre>
        </div>
      </div>
    </div>
  );
}
