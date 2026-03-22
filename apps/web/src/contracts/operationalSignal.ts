export interface OperationalSignalContract {
  bookingId: string;
  foId?: string;

  signalTimestamp: string;

  noAcceptance: boolean;
  offerExpired: boolean;
  slaMiss: boolean;
  reassignment: boolean;
  noShowRisk: boolean;
  overloadRisk: boolean;
}
