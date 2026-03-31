// editorialOverrideTypes.ts

export type EditorialOverrideMode = "force-pass" | "force-fail";

export type EditorialOverrideRecord = {
  slug: string;
  mode: EditorialOverrideMode;
  note: string;
  updatedAt: string;
};

export type EditorialOverrideFile = {
  records: EditorialOverrideRecord[];
};
