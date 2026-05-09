import { useEffect, useMemo, useRef, useState } from "react";
import { buildEstimateRequestKey } from "./bookingEstimateKey";
import {
  type EstimateFailureType,
  type EstimateState,
  createInitialEstimateState,
} from "./bookingEstimateState";
import { previewEstimate } from "./bookingDirectionIntakeApi";

function failureTypeFromError(err: unknown): EstimateFailureType {
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    typeof (err as { type: unknown }).type === "string"
  ) {
    const t = (err as { type: string }).type;
    if (t === "ESTIMATE_EXECUTION_FAILED" || t === "ESTIMATE_INPUT_INVALID") {
      return t;
    }
  }
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (
    message.includes("n’t valid for an automated preview") ||
    message.includes("n't valid for an automated preview") ||
    message.includes("invalid for an automated preview")
  ) {
    return "ESTIMATE_INPUT_INVALID";
  }
  if (
    message.includes("couldn’t compute a price preview") ||
    message.includes("couldn't compute a price preview") ||
    message.includes("couldn’t compute") ||
    message.includes("couldn't compute")
  ) {
    return "ESTIMATE_EXECUTION_FAILED";
  }
  return "UNKNOWN";
}

export function useBookingEstimate(input: Record<string, unknown> | null) {
  const [state, setState] = useState<EstimateState>(createInitialEstimateState());
  const inputRef = useRef(input);
  inputRef.current = input;

  const requestKey = useMemo(
    () => (input == null ? "__idle__" : buildEstimateRequestKey(input)),
    [input],
  );

  useEffect(() => {
    const latest = inputRef.current;
    if (latest == null) {
      setState(createInitialEstimateState());
      return;
    }

    const key = buildEstimateRequestKey(latest);
    let cancelled = false;

    setState({
      status: "loading",
      requestKey: key,
      data: null,
    });

    void previewEstimate(latest as Parameters<typeof previewEstimate>[0])
      .then((res) => {
        if (cancelled) return;
        setState((prev) => {
          if (prev.requestKey !== key) return prev;
          return {
            status: "success",
            requestKey: key,
            data: res,
          };
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((prev) => {
          if (prev.requestKey !== key) return prev;
          const raw =
            err instanceof Error ? err.message : String(err ?? "Estimate failed");
          const errorMessage =
            raw === "Failed to fetch" ||
            raw === "NetworkError when attempting to fetch resource."
              ? "We couldn’t reach the live quote service from this page (often a network or browser security block). Try refreshing, or try again in a moment."
              : raw || "Estimate failed";
          return {
            status: "error",
            requestKey: key,
            data: null,
            failureType: failureTypeFromError(err),
            errorMessage,
          };
        });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  return state;
}
