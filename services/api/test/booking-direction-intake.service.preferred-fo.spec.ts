import { BookingDirectionIntakeService } from "../src/modules/booking-direction-intake/booking-direction-intake.service";
import { PrismaService } from "../src/prisma";
import type { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";

describe("BookingDirectionIntakeService — preferredFoId persistence", () => {
  it("persists preferredFoId on create", async () => {
    const create = jest.fn().mockResolvedValue({ id: "int1", createdAt: new Date() });
    const prisma = {
      bookingDirectionIntake: { create },
    } as unknown as PrismaService;

    const svc = new BookingDirectionIntakeService(prisma);
    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "Single family about 2200 sqft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      preferredFoId: "fo_save_test",
      estimateFactors: {
        propertyType: "house",
        floors: "1",
        firstTimeWithServelink: "no",
        lastProfessionalClean: "1_3_months",
        clutterLevel: "light",
        kitchenCondition: "normal",
        stovetopType: "not_sure",
        bathroomCondition: "normal",
        glassShowers: "none",
        petPresence: "none",
        petAccidentsOrLitterAreas: "no",
        occupancyState: "occupied_normal",
        floorVisibility: "mostly_clear",
        carpetPercent: "26_50",
        stairsFlights: "none",
        addonIds: [],
      },
    } as unknown as CreateBookingDirectionIntakeDto;

    await svc.create(dto);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferredFoId: "fo_save_test",
        }),
      }),
    );
  });
});
