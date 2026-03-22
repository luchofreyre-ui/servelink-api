export type KnownCitySlug =
  | "tulsa-ok"
  | "broken-arrow-ok"
  | "jenks-ok"
  | "bixby-ok";

export type LocationContext = {
  citySlug?: KnownCitySlug;
  cityLabel?: string;
  source: "route" | "pathname" | "default";
};
