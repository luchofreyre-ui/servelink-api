import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";

describe("CreateBookingDirectionIntakeDto — preferredFoId", () => {
  it("accepts an optional cuid-shaped preferredFoId", async () => {
    const dto = plainToInstance(CreateBookingDirectionIntakeDto, {
      serviceId: "recurring-home-cleaning",
      homeSize: "Single family about 2200 sqft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      preferredFoId: "clxy1234567890abcdefghijk",
      serviceLocation: {
        street: "100 Market Street",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
      },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("treats blank preferredFoId as omitted", async () => {
    const dto = plainToInstance(CreateBookingDirectionIntakeDto, {
      serviceId: "recurring-home-cleaning",
      homeSize: "Single family about 2200 sqft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      preferredFoId: "   ",
      serviceLocation: {
        street: "100 Market Street",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
      },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.preferredFoId).toBeUndefined();
  });
});
