import type { KnowledgeEvidenceField } from "./types";

export const KNOWLEDGE_EVIDENCE_STANDARD: KnowledgeEvidenceField[] = [
  {
    key: "soil-types",
    label: "Soil Types",
    description: "Identifies the residue, contamination, or soil categories involved.",
    required: true,
  },
  {
    key: "surface-types",
    label: "Surface Types",
    description: "Identifies the surfaces or material classes involved.",
    required: true,
  },
  {
    key: "chemistry-class",
    label: "Chemistry Class",
    description: "Explains the chemistry class or cleaning mechanism being used.",
    required: true,
  },
  {
    key: "tool-types",
    label: "Tool Types",
    description: "Lists tools used and implies why they fit the task.",
    required: true,
  },
  {
    key: "towel-types",
    label: "Towel Types",
    description: "Specifies towel or absorbent material guidance where relevant.",
    required: true,
  },
  {
    key: "dwell-time-guidance",
    label: "Dwell Time Guidance",
    description: "Explains contact time or pre-softening considerations.",
    required: true,
  },
  {
    key: "moisture-control-guidance",
    label: "Moisture Control Guidance",
    description: "Explains drying, extraction, rinsing, or moisture limitation needs.",
    required: true,
  },
  {
    key: "avoid-on-surfaces",
    label: "Avoid-On Surfaces",
    description: "Specifies where a method, product, or tool should not be used.",
    required: true,
  },
  {
    key: "safety-notes",
    label: "Safety Notes",
    description: "Covers damage prevention, compatibility, or handling concerns.",
    required: true,
  },
  {
    key: "professional-escalation-threshold",
    label: "Professional Escalation Threshold",
    description: "Explains when the work should be escalated to a professional.",
    required: true,
  },
  {
    key: "why-this-works",
    label: "Why This Works",
    description: "Mechanistic explanation of why the method is effective.",
    required: true,
  },
  {
    key: "residue-considerations",
    label: "Residue Considerations",
    description: "Explains what happens if residue is not fully removed.",
    required: true,
  },
];
