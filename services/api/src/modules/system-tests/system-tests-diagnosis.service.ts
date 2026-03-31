import { Injectable } from "@nestjs/common";
import {
  SystemTestsDiagnosisInput,
  SystemTestsDiagnosisResult,
  SystemTestsDiagnosisSignal,
} from "./system-tests-diagnosis.types";
import { SYSTEM_TESTS_DIAGNOSIS_RULES } from "./system-tests-diagnosis.rules";

@Injectable()
export class SystemTestsDiagnosisService {
  diagnose(input: SystemTestsDiagnosisInput): SystemTestsDiagnosisResult {
    const haystack = this.buildHaystack(input);
    const ranked = SYSTEM_TESTS_DIAGNOSIS_RULES.map((rule) => {
      const signals: SystemTestsDiagnosisSignal[] = [];

      for (const pattern of rule.patterns) {
        const match = haystack.match(pattern);
        if (match) {
          signals.push({
            code: rule.id,
            label: rule.label,
            matchedText: match[0] ?? null,
          });
        }
      }

      if (!signals.length) {
        return null;
      }

      return {
        rule,
        signals,
        score: signals.length * rule.confidence,
      };
    })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best) {
      return {
        familyId: input.familyId,
        category: "unknown",
        rootCause:
          "The current diagnosis rules could not confidently classify this failure family.",
        confidence: 0.4,
        summary:
          "No strong rule matched this failure family. Review the evidence manually and extend diagnosis rules if this pattern recurs.",
        signals: [
          {
            code: "unknown",
            label: "No diagnosis rule matched",
            matchedText: null,
          },
        ],
      };
    }

    return {
      familyId: input.familyId,
      category: best.rule.category,
      rootCause: best.rule.rootCause,
      confidence: Math.min(0.99, Number((best.rule.confidence + best.signals.length * 0.01).toFixed(2))),
      summary: best.rule.summary,
      signals: best.signals.slice(0, 8),
    };
  }

  private buildHaystack(input: SystemTestsDiagnosisInput): string {
    return [
      input.title,
      input.fingerprint ?? "",
      ...input.failureMessages,
      ...input.stackTraces,
      ...input.filePaths,
      ...input.artifactTexts,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
}
