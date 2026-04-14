import { BookingSectionCard } from "../BookingSectionCard";
import { BookingSelectField } from "./BookingSelectField";
import type { BookingFlowState } from "./bookingFlowTypes";
import type { BookingEstimateFactorsState } from "./bookingEstimateFactors";
import { ESTIMATE_ADDON_OPTIONS } from "./bookingEstimateFactors";
import {
  BATHROOM_CONDITION_OPTIONS,
  CARPET_PERCENT_OPTIONS,
  CLUTTER_OPTIONS,
  FIRST_TIME_OPTIONS,
  FLOOR_VISIBILITY_OPTIONS,
  FLOORS_OPTIONS,
  GLASS_SHOWERS_OPTIONS,
  KITCHEN_CONDITION_OPTIONS,
  LAST_PRO_CLEAN_OPTIONS,
  OCCUPANCY_OPTIONS,
  PET_ACCIDENTS_OPTIONS,
  PET_PRESENCE_OPTIONS,
  PET_SHEDDING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  STAIRS_OPTIONS,
  STOVETOP_OPTIONS,
  withEmpty,
} from "./bookingEstimateFactorFieldOptions";

type BookingStepEstimateFactorsProps = {
  state: BookingFlowState;
  onChange: (patch: Partial<BookingFlowState>) => void;
};

function patchFactors(
  prev: BookingEstimateFactorsState,
  patch: Partial<BookingEstimateFactorsState>,
): BookingEstimateFactorsState {
  const next = { ...prev, ...patch };
  if (patch.petPresence === "none") {
    next.petShedding = "";
  }
  return next;
}

export function BookingStepEstimateFactors({
  state,
  onChange,
}: BookingStepEstimateFactorsProps) {
  const f = state.estimateFactors;

  function setFactors(patch: Partial<BookingEstimateFactorsState>) {
    onChange({ estimateFactors: patchFactors(f, patch) });
  }

  function toggleAddon(id: string) {
    const has = f.addonIds.includes(id);
    const addonIds = has
      ? f.addonIds.filter((x) => x !== id)
      : [...f.addonIds, id];
    setFactors({ addonIds });
  }

  return (
    <BookingSectionCard
      eyebrow="Step 3"
      title="Job details for your estimate"
      body="These answers feed directly into your quote—nothing here is assumed for you."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <BookingSelectField
          label="Property type"
          value={f.propertyType}
          onChange={(propertyType) => setFactors({ propertyType })}
          options={withEmpty(PROPERTY_TYPE_OPTIONS, "Select property type")}
          placeholder="Select property type"
        />
        <BookingSelectField
          label="Floors in home"
          value={f.floors}
          onChange={(floors) => setFactors({ floors })}
          options={withEmpty(FLOORS_OPTIONS, "Select floors")}
          placeholder="Select floors"
        />
        <BookingSelectField
          label="First time with Servelink?"
          value={f.firstTimeWithServelink}
          onChange={(firstTimeWithServelink) =>
            setFactors({ firstTimeWithServelink })
          }
          options={withEmpty(FIRST_TIME_OPTIONS, "Select one")}
          placeholder="Select one"
        />
        <BookingSelectField
          label="Last professional clean"
          value={f.lastProfessionalClean}
          onChange={(lastProfessionalClean) =>
            setFactors({ lastProfessionalClean })
          }
          options={withEmpty(LAST_PRO_CLEAN_OPTIONS, "Select timeframe")}
          placeholder="Select timeframe"
        />
        <BookingSelectField
          label="Clutter level"
          value={f.clutterLevel}
          onChange={(clutterLevel) => setFactors({ clutterLevel })}
          options={withEmpty(CLUTTER_OPTIONS, "Select clutter level")}
          placeholder="Select clutter level"
        />
        <BookingSelectField
          label="Kitchen condition"
          value={f.kitchenCondition}
          onChange={(kitchenCondition) => setFactors({ kitchenCondition })}
          options={withEmpty(KITCHEN_CONDITION_OPTIONS, "Select kitchen")}
          placeholder="Select kitchen"
        />
        <BookingSelectField
          label="Stovetop type"
          value={f.stovetopType}
          onChange={(stovetopType) => setFactors({ stovetopType })}
          options={withEmpty(STOVETOP_OPTIONS, "Select stovetop")}
          placeholder="Select stovetop"
        />
        <BookingSelectField
          label="Bathroom condition"
          value={f.bathroomCondition}
          onChange={(bathroomCondition) => setFactors({ bathroomCondition })}
          options={withEmpty(BATHROOM_CONDITION_OPTIONS, "Select bathrooms")}
          placeholder="Select bathrooms"
        />
        <BookingSelectField
          label="Glass showers"
          value={f.glassShowers}
          onChange={(glassShowers) => setFactors({ glassShowers })}
          options={withEmpty(GLASS_SHOWERS_OPTIONS, "Select glass showers")}
          placeholder="Select glass showers"
        />
        <BookingSelectField
          label="Pet presence"
          value={f.petPresence}
          onChange={(petPresence) => setFactors({ petPresence })}
          options={withEmpty(PET_PRESENCE_OPTIONS, "Select pets")}
          placeholder="Select pets"
        />
        {f.petPresence !== "none" && f.petPresence !== "" ? (
          <BookingSelectField
            label="Pet shedding"
            value={f.petShedding}
            onChange={(petShedding) => setFactors({ petShedding })}
            options={withEmpty(PET_SHEDDING_OPTIONS, "Select shedding")}
            placeholder="Select shedding"
          />
        ) : null}
        <BookingSelectField
          label="Pet accidents / heavy litter areas"
          value={f.petAccidentsOrLitterAreas}
          onChange={(petAccidentsOrLitterAreas) =>
            setFactors({ petAccidentsOrLitterAreas })
          }
          options={withEmpty(PET_ACCIDENTS_OPTIONS, "Select one")}
          placeholder="Select one"
        />
        <BookingSelectField
          label="Occupancy during service"
          value={f.occupancyState}
          onChange={(occupancyState) => setFactors({ occupancyState })}
          options={withEmpty(OCCUPANCY_OPTIONS, "Select occupancy")}
          placeholder="Select occupancy"
        />
        <BookingSelectField
          label="Floor visibility / obstacles"
          value={f.floorVisibility}
          onChange={(floorVisibility) => setFactors({ floorVisibility })}
          options={withEmpty(FLOOR_VISIBILITY_OPTIONS, "Select visibility")}
          placeholder="Select visibility"
        />
        <BookingSelectField
          label="Carpet coverage"
          value={f.carpetPercent}
          onChange={(carpetPercent) => setFactors({ carpetPercent })}
          options={withEmpty(CARPET_PERCENT_OPTIONS, "Select carpet %")}
          placeholder="Select carpet %"
        />
        <BookingSelectField
          label="Interior stairs"
          value={f.stairsFlights}
          onChange={(stairsFlights) => setFactors({ stairsFlights })}
          options={withEmpty(STAIRS_OPTIONS, "Select stairs")}
          placeholder="Select stairs"
        />
      </div>

      <div className="mt-8 border-t border-[#C9B27C]/14 pt-8">
        <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
          Add-ons (optional)
        </p>
        <p className="mt-1 font-[var(--font-manrope)] text-sm text-[#64748B]">
          Select any extras to include in labor for this estimate. Leave all
          unchecked if none.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ESTIMATE_ADDON_OPTIONS.map((row) => (
            <label
              key={row.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#C9B27C]/16 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A]"
            >
              <input
                type="checkbox"
                checked={f.addonIds.includes(row.id)}
                onChange={() => toggleAddon(row.id)}
                className="size-4 rounded border-[#C9B27C]/40 text-[#0D9488] focus:ring-[#0D9488]"
              />
              {row.label}
            </label>
          ))}
        </div>
      </div>
    </BookingSectionCard>
  );
}
