"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AdminDispatchDecisionInput,
  AdminDispatchDecisionResult,
} from "@/contracts/adminDispatchDecision";
import {
  AdminDispatchDecisionApiError,
  submitAdminDispatchDecision,
} from "./adminDispatchDecisionApi";

export interface AdminDispatchDecisionMutationState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isUnavailable: boolean;
  errorMessage?: string;
  successMessage?: string;
  unavailableMessage?: string;
  lastResult?: AdminDispatchDecisionResult;
}

const INITIAL_STATE: AdminDispatchDecisionMutationState = {
  isSubmitting: false,
  isSuccess: false,
  isUnavailable: false,
};

export function useAdminDispatchDecisionMutation() {
  const [state, setState] = useState<AdminDispatchDecisionMutationState>(INITIAL_STATE);

  const submit = useCallback(async (input: AdminDispatchDecisionInput) => {
    setState({
      isSubmitting: true,
      isSuccess: false,
      isUnavailable: false,
    });

    try {
      const result = await submitAdminDispatchDecision(input);

      if (result.status === "unavailable") {
        setState({
          isSubmitting: false,
          isSuccess: false,
          isUnavailable: true,
          unavailableMessage: result.message,
          lastResult: result,
        });

        return result;
      }

      setState({
        isSubmitting: false,
        isSuccess: result.ok,
        isUnavailable: false,
        successMessage: result.message,
        lastResult: result,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof AdminDispatchDecisionApiError
          ? error.message
          : "Dispatch decision submission failed unexpectedly.";

      setState({
        isSubmitting: false,
        isSuccess: false,
        isUnavailable: false,
        errorMessage: message,
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return useMemo(
    () => ({
      ...state,
      submit,
      reset,
    }),
    [state, submit, reset],
  );
}
