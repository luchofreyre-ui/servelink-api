import { Counter, Histogram } from "prom-client";

/*
Dispatch candidate pipeline
*/

export const dispatchCandidatesTotal = new Counter({
  name: "dispatch_candidates_total",
  help: "Total candidates returned by estimator before filtering",
});

export const dispatchCandidatesGeoFiltered = new Counter({
  name: "dispatch_candidates_geo_filtered",
  help: "Candidates removed by geographic filtering",
});

export const dispatchCandidatesScored = new Counter({
  name: "dispatch_candidates_scored",
  help: "Candidates scored for dispatch",
});

export const dispatchCandidatesLimited = new Counter({
  name: "dispatch_candidates_limited",
  help: "Candidates remaining after MAX_SCORED_CANDIDATES cap",
});

/*
Offer lifecycle
*/

export const dispatchOffersCreated = new Counter({
  name: "dispatch_offers_created",
  help: "Total dispatch offers created",
});

export const dispatchOffersExpired = new Counter({
  name: "dispatch_offers_expired",
  help: "Offers expired without acceptance",
});

export const dispatchOfferAccepted = new Counter({
  name: "dispatch_offer_accepted",
  help: "Offers accepted by franchise owners",
});

/*
Offer latency
*/

export const dispatchOfferAcceptSeconds = new Histogram({
  name: "dispatch_offer_accept_seconds",
  help: "Seconds between offer activation and acceptance",
  buckets: [5, 10, 20, 30, 60, 120, 300],
});

/*
Round activation
*/

export const dispatchRoundActivated = new Counter({
  name: "dispatch_round_activated",
  help: "Dispatch rounds activated",
});

export const dispatchRoundFallback = new Counter({
  name: "dispatch_round_fallback",
  help: "Dispatch fallback when earlier rounds empty",
});

export const dispatchRadiusMilesObserved = new Histogram({
  name: "dispatch_radius_miles_observed",
  help: "Dispatch radius used for candidate selection",
  buckets: [10, 20, 30, 45, 60, 80],
});
