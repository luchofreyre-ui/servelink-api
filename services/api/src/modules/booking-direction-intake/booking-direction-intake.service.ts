import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import type { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";
import { resolveEstimateFactorsForPublicIntake } from "./estimate-factors-sanitize";
import { intakeServiceIdImpliesDeepClean } from "./intake-service-type.util";

@Injectable()
export class BookingDirectionIntakeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateBookingDirectionIntakeDto,
    geocoded?: { siteLat: number; siteLng: number } | null,
  ) {
    const utm = dto.utm;
    const deepOk = intakeServiceIdImpliesDeepClean(dto.serviceId);
    const deepCleanProgram =
      deepOk && dto.deepCleanProgram ? dto.deepCleanProgram : null;

    const sl = dto.serviceLocation;

    const row = await this.prisma.bookingDirectionIntake.create({
      data: {
        serviceId: dto.serviceId.trim(),
        homeSize: dto.homeSize.trim(),
        bedrooms: dto.bedrooms.trim(),
        bathrooms: dto.bathrooms.trim(),
        pets: (dto.pets ?? "").trim(),
        frequency: dto.frequency.trim(),
        preferredTime: dto.preferredTime.trim(),
        preferredFoId: dto.preferredFoId?.trim() || null,
        deepCleanProgram,
        estimateFactors: resolveEstimateFactorsForPublicIntake(
          dto.estimateFactors ?? undefined,
        ) as object,
        customerName: dto.customerName?.trim() || null,
        customerEmail: dto.customerEmail?.trim() || null,
        source: dto.source?.trim() || null,
        utmSource: utm?.source?.trim() || null,
        utmMedium: utm?.medium?.trim() || null,
        utmCampaign: utm?.campaign?.trim() || null,
        utmContent: utm?.content?.trim() || null,
        utmTerm: utm?.term?.trim() || null,
        serviceLocationStreet: sl?.street?.trim() || null,
        serviceLocationCity: sl?.city?.trim() || null,
        serviceLocationState: sl?.state?.trim() || null,
        serviceLocationZip: sl?.zip?.trim() || null,
        serviceLocationUnit: sl?.unit?.trim() || null,
        siteLat: geocoded?.siteLat ?? null,
        siteLng: geocoded?.siteLng ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return {
      kind: "booking_direction_intake" as const,
      intakeId: row.id,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listForAdmin(opts: { limit: number; offset: number }) {
    const take = Math.min(Math.max(opts.limit, 1), 100);
    const skip = Math.max(opts.offset, 0);

    const [items, total] = await Promise.all([
      this.prisma.bookingDirectionIntake.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.bookingDirectionIntake.count(),
    ]);

    return {
      kind: "booking_direction_intake_list" as const,
      items: items.map((row) => ({
        intakeId: row.id,
        bookingId: row.bookingId,
        serviceId: row.serviceId,
        homeSize: row.homeSize,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        pets: row.pets,
        frequency: row.frequency,
        preferredTime: row.preferredTime,
        preferredFoId: row.preferredFoId,
        deepCleanProgram: row.deepCleanProgram,
        hasEstimateFactors: row.estimateFactors != null,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        source: row.source,
        utm: {
          source: row.utmSource,
          medium: row.utmMedium,
          campaign: row.utmCampaign,
          content: row.utmContent,
          term: row.utmTerm,
        },
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      limit: take,
      offset: skip,
    };
  }
}
