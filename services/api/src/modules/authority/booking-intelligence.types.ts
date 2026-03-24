export interface BookingAuthorityTagResult {
  surfaces: string[];
  problems: string[];
  methods: string[];
  reasons: string[];
}

export interface BookingAuthorityInput {
  serviceType?: string | null;
  notes?: string | null;
  addressLine1?: string | null;
  metadata?: Record<string, unknown> | null;
}
