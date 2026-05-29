import type {
  VisualDiagnosticProfile,
  VisualDiagnosticValidationError,
  VisualDiagnosticValidationResult,
} from "./visualAuthorityTypes";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

function pushError(
  errors: VisualDiagnosticValidationError[],
  slug: string,
  field: VisualDiagnosticValidationError["field"],
  message: string,
): void {
  errors.push({ slug, field, message });
}

function validateStringField(
  errors: VisualDiagnosticValidationError[],
  profile: VisualDiagnosticProfile,
  field: keyof Pick<
    VisualDiagnosticProfile,
    | "slug"
    | "title"
    | "assetId"
    | "alt"
    | "diagnosticClaim"
    | "expertRead"
    | "wrongActionRisk"
    | "nextAction"
    | "stopCondition"
    | "approvalNotes"
  >,
): void {
  if (isBlank(profile[field])) {
    pushError(errors, profile.slug || "(missing-slug)", field, `${field} is required`);
  }
}

function validateNonEmptyArrayField(
  errors: VisualDiagnosticValidationError[],
  profile: VisualDiagnosticProfile,
  field: keyof Pick<
    VisualDiagnosticProfile,
    "visualPurpose" | "visibleMarkers" | "workflowStage"
  >,
): void {
  if (!profile[field].length) {
    pushError(errors, profile.slug, field, `${field} must include at least one value`);
  }
}

export function validateVisualDiagnosticProfile(
  profile: VisualDiagnosticProfile,
): VisualDiagnosticValidationResult {
  const errors: VisualDiagnosticValidationError[] = [];

  validateStringField(errors, profile, "slug");
  validateStringField(errors, profile, "title");
  validateStringField(errors, profile, "assetId");
  validateStringField(errors, profile, "alt");
  validateStringField(errors, profile, "diagnosticClaim");
  validateStringField(errors, profile, "expertRead");
  validateStringField(errors, profile, "wrongActionRisk");
  validateStringField(errors, profile, "nextAction");
  validateStringField(errors, profile, "stopCondition");
  validateStringField(errors, profile, "approvalNotes");

  if (profile.slug && !SLUG_RE.test(profile.slug)) {
    pushError(errors, profile.slug, "slug", "slug must be lowercase kebab-case");
  }

  validateNonEmptyArrayField(errors, profile, "visualPurpose");
  validateNonEmptyArrayField(errors, profile, "visibleMarkers");
  validateNonEmptyArrayField(errors, profile, "workflowStage");

  if (profile.visibleMarkers.some((marker) => isBlank(marker))) {
    pushError(errors, profile.slug, "visibleMarkers", "visibleMarkers cannot contain blank values");
  }

  if (
    profile.visualPurpose.includes("misidentification") &&
    (profile.misidentifiedAs.length === 0 || profile.distinguishFrom.length === 0)
  ) {
    pushError(
      errors,
      profile.slug,
      "misidentifiedAs",
      "misidentification profiles require both misidentifiedAs and distinguishFrom values",
    );
  }

  if (
    !profile.visualPurpose.includes("misidentification") &&
    profile.authorityKind === "misidentification"
  ) {
    pushError(
      errors,
      profile.slug,
      "visualPurpose",
      "misidentification authorityKind requires misidentification visualPurpose",
    );
  }

  if (
    profile.assetStatus === "planned" &&
    profile.source !== "not-yet-generated"
  ) {
    pushError(
      errors,
      profile.slug,
      "source",
      "planned profiles must use not-yet-generated source",
    );
  }

  if (
    profile.source === "not-yet-generated" &&
    profile.src !== null
  ) {
    pushError(
      errors,
      profile.slug,
      "src",
      "not-yet-generated profiles must not reference an image src",
    );
  }

  if (isBlank(profile.diagnosticClaim)) {
    pushError(
      errors,
      profile.slug || "(missing-slug)",
      "diagnosticClaim",
      "decorative visuals are forbidden: diagnosticClaim is required",
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateVisualDiagnosticProfiles(
  profiles: readonly VisualDiagnosticProfile[],
): VisualDiagnosticValidationResult {
  const errors = profiles.flatMap(
    (profile) => validateVisualDiagnosticProfile(profile).errors,
  );
  const seenSlugs = new Set<string>();
  const seenAssetIds = new Set<string>();

  for (const profile of profiles) {
    if (seenSlugs.has(profile.slug)) {
      pushError(errors, profile.slug, "slug", "slug must be unique");
    }
    seenSlugs.add(profile.slug);

    if (seenAssetIds.has(profile.assetId)) {
      pushError(errors, profile.slug, "assetId", "assetId must be unique");
    }
    seenAssetIds.add(profile.assetId);
  }

  return { valid: errors.length === 0, errors };
}
