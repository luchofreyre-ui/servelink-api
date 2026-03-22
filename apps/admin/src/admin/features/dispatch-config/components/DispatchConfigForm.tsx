import { useState, useEffect } from "react";
import { AdminTextInput } from "../../../app/components/forms/AdminTextInput";
import type { DispatchConfigRecord, UpdateDraftDispatchConfigPayload } from "../api/types";

const WEIGHT_MIN = 0;
const WEIGHT_MAX = 100;
const OFFER_EXPIRY_MIN = 1;
const ASSIGNED_GRACE_MIN = 1;
const MULTI_PASS_MIN = 0;

type FormState = {
  label: string;
  acceptancePenaltyWeight: string;
  completionPenaltyWeight: string;
  cancellationPenaltyWeight: string;
  loadPenaltyWeight: string;
  reliabilityBonusWeight: string;
  responseSpeedWeight: string;
  offerExpiryMinutes: string;
  assignedStartGraceMinutes: string;
  multiPassPenaltyStep: string;
  enableResponseSpeedWeighting: boolean;
  enableReliabilityWeighting: boolean;
  allowReofferAfterExpiry: boolean;
};

function toFormState(c: DispatchConfigRecord | undefined): FormState {
  if (!c) {
    return {
      label: "",
      acceptancePenaltyWeight: "",
      completionPenaltyWeight: "",
      cancellationPenaltyWeight: "",
      loadPenaltyWeight: "",
      reliabilityBonusWeight: "",
      responseSpeedWeight: "",
      offerExpiryMinutes: "",
      assignedStartGraceMinutes: "",
      multiPassPenaltyStep: "",
      enableResponseSpeedWeighting: false,
      enableReliabilityWeighting: false,
      allowReofferAfterExpiry: false,
    };
  }
  return {
    label: c.label ?? "",
    acceptancePenaltyWeight: c.acceptancePenaltyWeight ?? "",
    completionPenaltyWeight: c.completionPenaltyWeight ?? "",
    cancellationPenaltyWeight: c.cancellationPenaltyWeight ?? "",
    loadPenaltyWeight: c.loadPenaltyWeight ?? "",
    reliabilityBonusWeight: c.reliabilityBonusWeight ?? "",
    responseSpeedWeight: c.responseSpeedWeight ?? "",
    offerExpiryMinutes: String(c.offerExpiryMinutes ?? ""),
    assignedStartGraceMinutes: String(c.assignedStartGraceMinutes ?? ""),
    multiPassPenaltyStep: c.multiPassPenaltyStep ?? "",
    enableResponseSpeedWeighting: c.enableResponseSpeedWeighting ?? false,
    enableReliabilityWeighting: c.enableReliabilityWeighting ?? false,
    allowReofferAfterExpiry: c.allowReofferAfterExpiry ?? false,
  };
}

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(form: FormState): UpdateDraftDispatchConfigPayload {
  const payload: UpdateDraftDispatchConfigPayload = {};
  if (form.label !== undefined) payload.label = form.label || null;
  const a = parseNum(form.acceptancePenaltyWeight);
  if (a != null) payload.acceptancePenaltyWeight = a;
  const c = parseNum(form.completionPenaltyWeight);
  if (c != null) payload.completionPenaltyWeight = c;
  const cancel = parseNum(form.cancellationPenaltyWeight);
  if (cancel != null) payload.cancellationPenaltyWeight = cancel;
  const load = parseNum(form.loadPenaltyWeight);
  if (load != null) payload.loadPenaltyWeight = load;
  const rel = parseNum(form.reliabilityBonusWeight);
  if (rel != null) payload.reliabilityBonusWeight = rel;
  const resp = parseNum(form.responseSpeedWeight);
  if (resp != null) payload.responseSpeedWeight = resp;
  const offer = parseNum(form.offerExpiryMinutes);
  if (offer != null) payload.offerExpiryMinutes = Math.max(OFFER_EXPIRY_MIN, Math.floor(offer));
  const grace = parseNum(form.assignedStartGraceMinutes);
  if (grace != null) payload.assignedStartGraceMinutes = Math.max(ASSIGNED_GRACE_MIN, Math.floor(grace));
  const multi = parseNum(form.multiPassPenaltyStep);
  if (multi != null) payload.multiPassPenaltyStep = Math.max(MULTI_PASS_MIN, multi);
  payload.enableResponseSpeedWeighting = form.enableResponseSpeedWeighting;
  payload.enableReliabilityWeighting = form.enableReliabilityWeighting;
  payload.allowReofferAfterExpiry = form.allowReofferAfterExpiry;
  return payload;
}

export type DispatchConfigFormErrors = Partial<Record<keyof FormState, string>>;

export function validateDispatchConfigForm(form: FormState): DispatchConfigFormErrors {
  const err: DispatchConfigFormErrors = {};
  const w = (key: keyof FormState, s: string) => {
    const n = parseNum(s);
    if (n === null && s !== "") {
      err[key] = "Must be a number";
      return;
    }
    if (n !== null && (n < WEIGHT_MIN || n > WEIGHT_MAX)) {
      err[key] = `Between ${WEIGHT_MIN} and ${WEIGHT_MAX}`;
    }
  };
  w("acceptancePenaltyWeight", form.acceptancePenaltyWeight);
  w("completionPenaltyWeight", form.completionPenaltyWeight);
  w("cancellationPenaltyWeight", form.cancellationPenaltyWeight);
  w("loadPenaltyWeight", form.loadPenaltyWeight);
  w("reliabilityBonusWeight", form.reliabilityBonusWeight);
  w("responseSpeedWeight", form.responseSpeedWeight);

  const offer = parseNum(form.offerExpiryMinutes);
  if (offer !== null && offer < OFFER_EXPIRY_MIN) err.offerExpiryMinutes = `Min ${OFFER_EXPIRY_MIN}`;
  const grace = parseNum(form.assignedStartGraceMinutes);
  if (grace !== null && grace < ASSIGNED_GRACE_MIN) err.assignedStartGraceMinutes = `Min ${ASSIGNED_GRACE_MIN}`;
  const multi = parseNum(form.multiPassPenaltyStep);
  if (multi !== null && multi < MULTI_PASS_MIN) err.multiPassPenaltyStep = `Min ${MULTI_PASS_MIN}`;

  return err;
}

type DispatchConfigFormProps = {
  draft: DispatchConfigRecord | undefined;
  isSaving: boolean;
  onSave: (payload: UpdateDraftDispatchConfigPayload) => void;
};

export function DispatchConfigForm({
  draft,
  isSaving,
  onSave,
}: DispatchConfigFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(draft));
  const [errors, setErrors] = useState<DispatchConfigFormErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (draft && !touched) setForm(toFormState(draft));
  }, [draft?.id, draft?.updatedAt, touched]);

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const handleSave = () => {
    const e = validateDispatchConfigForm(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave(buildPayload(form));
    setTouched(false);
  };

  const weightFields: Array<{ key: keyof FormState; label: string }> = [
    { key: "acceptancePenaltyWeight", label: "Acceptance penalty weight" },
    { key: "completionPenaltyWeight", label: "Completion penalty weight" },
    { key: "cancellationPenaltyWeight", label: "Cancellation penalty weight" },
    { key: "loadPenaltyWeight", label: "Load penalty weight" },
    { key: "reliabilityBonusWeight", label: "Reliability bonus weight" },
    { key: "responseSpeedWeight", label: "Response speed weight" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Label</h3>
        <AdminTextInput
          value={form.label}
          onChange={(v) => update("label", v)}
          placeholder="Draft label"
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Weights (0–100)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {weightFields.map(({ key, label }) => (
            <div key={key}>
              <AdminTextInput
                label={label}
                type="text"
                value={form[key] as string}
                onChange={(v) => update(key, v)}
              />
              {errors[key] ? (
                <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Timing</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <AdminTextInput
              label="Offer expiry (minutes)"
              type="text"
              value={form.offerExpiryMinutes}
              onChange={(v) => update("offerExpiryMinutes", v)}
            />
            {errors.offerExpiryMinutes ? (
              <p className="mt-1 text-xs text-red-600">{errors.offerExpiryMinutes}</p>
            ) : null}
          </div>
          <div>
            <AdminTextInput
              label="Assigned start grace (minutes)"
              type="text"
              value={form.assignedStartGraceMinutes}
              onChange={(v) => update("assignedStartGraceMinutes", v)}
            />
            {errors.assignedStartGraceMinutes ? (
              <p className="mt-1 text-xs text-red-600">{errors.assignedStartGraceMinutes}</p>
            ) : null}
          </div>
          <div>
            <AdminTextInput
              label="Multi-pass penalty step"
              type="text"
              value={form.multiPassPenaltyStep}
              onChange={(v) => update("multiPassPenaltyStep", v)}
            />
            {errors.multiPassPenaltyStep ? (
              <p className="mt-1 text-xs text-red-600">{errors.multiPassPenaltyStep}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Behavior</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enableResponseSpeedWeighting}
              onChange={(e) => update("enableResponseSpeedWeighting", e.target.checked)}
            />
            <span className="text-sm">Enable response speed weighting</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enableReliabilityWeighting}
              onChange={(e) => update("enableReliabilityWeighting", e.target.checked)}
            />
            <span className="text-sm">Enable reliability weighting</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowReofferAfterExpiry}
              onChange={(e) => update("allowReofferAfterExpiry", e.target.checked)}
            />
            <span className="text-sm">Allow reoffer after expiry</span>
          </label>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          onClick={handleSave}
          disabled={isSaving || !touched}
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
      </div>
    </div>
  );
}
