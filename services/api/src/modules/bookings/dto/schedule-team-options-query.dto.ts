import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

function toBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return undefined;
}

export class ScheduleTeamOptionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  /** When false, only the primary/default team row is computed; alternates stay empty. */
  includeAlternateTeams?: boolean;
}
