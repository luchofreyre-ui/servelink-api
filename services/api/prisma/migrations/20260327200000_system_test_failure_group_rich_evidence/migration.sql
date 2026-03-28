-- Phase 7B: persisted rich evidence + artifact refs per failure group
ALTER TABLE "SystemTestFailureGroup" ADD COLUMN "richEvidenceJson" JSONB;
ALTER TABLE "SystemTestFailureGroup" ADD COLUMN "artifactRefsJson" JSONB;
