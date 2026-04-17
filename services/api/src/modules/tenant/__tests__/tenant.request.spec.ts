import { readRequestHost } from "../tenant.request";

describe("readRequestHost", () => {
  it("returns null for nullish or non-object", () => {
    expect(readRequestHost(null)).toBeNull();
    expect(readRequestHost(undefined)).toBeNull();
    expect(readRequestHost("string")).toBeNull();
  });

  it("prefers x-forwarded-host over host", () => {
    expect(
      readRequestHost({
        headers: {
          "x-forwarded-host": "forwarded.example.com",
          host: "www.nustandardcleaning.com",
        },
      }),
    ).toBe("forwarded.example.com");
  });

  it("uses first comma-separated value in x-forwarded-host", () => {
    expect(
      readRequestHost({
        headers: {
          "x-forwarded-host": " first.example.com , second.example.com ",
        },
      }),
    ).toBe("first.example.com");
  });

  it("uses host header when no forwarded host", () => {
    expect(
      readRequestHost({
        headers: { host: "www.nustandardcleaning.com" },
      }),
    ).toBe("www.nustandardcleaning.com");
  });

  it("uses first element when header is array", () => {
    expect(
      readRequestHost({
        headers: { host: ["www.nustandardcleaning.com", "ignored"] },
      }),
    ).toBe("www.nustandardcleaning.com");
  });

  it("falls back to top-level host", () => {
    expect(readRequestHost({ host: "direct.host.com" })).toBe("direct.host.com");
  });
});
