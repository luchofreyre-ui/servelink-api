import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { DEEP_CLEAN_REVIEW_TAGS } from "../deep-clean-review-tags";

const TAG_LIST = DEEP_CLEAN_REVIEW_TAGS as unknown as string[];

export class UpdateDeepCleanCalibrationReviewRequestDto {
  @IsIn(["unreviewed", "reviewed"])
  reviewStatus!: "unreviewed" | "reviewed";

  @ValidateIf((o: UpdateDeepCleanCalibrationReviewRequestDto) => o.reviewStatus === "reviewed")
  @IsArray()
  @ArrayMinSize(1, { message: "At least one reason tag is required when reviewStatus is reviewed" })
  @IsString({ each: true })
  @IsIn(TAG_LIST, { each: true })
  reviewReasonTags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reviewNote?: string | null;
}
