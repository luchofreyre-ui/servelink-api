// evidenceAttachmentTypes.ts

export type AttachedEvidenceRecord = {
  slug: string;
  evidenceIds: string[];
  updatedAt: string;
};

export type AttachedEvidenceFile = {
  records: AttachedEvidenceRecord[];
};
