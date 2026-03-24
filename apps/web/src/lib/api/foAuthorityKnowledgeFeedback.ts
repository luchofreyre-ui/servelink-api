function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

export type FoAuthorityKnowledgeFeedbackResponse = {
  kind: "fo_authority_knowledge_feedback";
  id: string;
  bookingId: string;
  helpful: boolean;
  createdAt: string;
};

export async function submitFoAuthorityKnowledgeFeedback(
  apiBase: string,
  token: string,
  bookingId: string,
  body: {
    helpful: boolean;
    selectedKnowledgePath?: string;
    notes?: string;
  },
): Promise<FoAuthorityKnowledgeFeedbackResponse> {
  const url = `${apiBase}/api/v1/fo/authority/bookings/${encodeURIComponent(bookingId)}/knowledge-feedback`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Knowledge feedback failed (${response.status})`),
    );
  }
  return payload as FoAuthorityKnowledgeFeedbackResponse;
}
