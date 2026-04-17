import { DEFAULT_TENANT_ID } from "../tenant.constants";
import { InvalidTenantException } from "../tenant.errors";
import { TenantResolver } from "../tenant.resolver";

describe("TenantResolver", () => {
  const resolver = new TenantResolver();

  describe("normalizeTenantId", () => {
    it("null => nustandard", () => {
      expect(resolver.normalizeTenantId(null)).toBe(DEFAULT_TENANT_ID);
    });

    it("blank => nustandard", () => {
      expect(resolver.normalizeTenantId("   ")).toBe(DEFAULT_TENANT_ID);
    });

    it("mixed case + spaces => normalized lowercase", () => {
      expect(resolver.normalizeTenantId("  NuStandard  ")).toBe("nustandard");
    });
  });

  describe("resolveFromHost", () => {
    it("www.nustandardcleaning.com => tenant nustandard, source host", () => {
      const r = resolver.resolveFromHost("www.nustandardcleaning.com");
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("host");
      expect(r.host).toBe("www.nustandardcleaning.com");
    });

    it("nustandardcleaning.com:443 => tenant nustandard, source host", () => {
      const r = resolver.resolveFromHost("nustandardcleaning.com:443");
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("host");
      expect(r.host).toBe("nustandardcleaning.com");
    });

    it("unknown host => tenant nustandard, source default", () => {
      const r = resolver.resolveFromHost("evil.example.com");
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("default");
    });
  });

  describe("resolve", () => {
    it("explicit valid nustandard with validation true => source explicit", () => {
      const r = resolver.resolve({
        tenantId: "nustandard",
        validateExplicitTenant: true,
      });
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("explicit");
    });

    it("explicit valid mixed case with validation true => normalized tenant nustandard", () => {
      const r = resolver.resolve({
        tenantId: " NuStandard ",
        validateExplicitTenant: true,
      });
      expect(r.tenantId).toBe("nustandard");
      expect(r.source).toBe("explicit");
    });

    it("explicit unknown tenant with validation false => accepted as explicit", () => {
      const r = resolver.resolve({
        tenantId: "legacy-unknown",
        validateExplicitTenant: false,
      });
      expect(r.tenantId).toBe("legacy-unknown");
      expect(r.source).toBe("explicit");
    });

    it("explicit unknown tenant with validation true => throws InvalidTenantException", () => {
      expect(() =>
        resolver.resolve({
          tenantId: "not-a-real-tenant",
          validateExplicitTenant: true,
        }),
      ).toThrow(InvalidTenantException);
    });

    it("no explicit tenant and known host => source host", () => {
      const r = resolver.resolve({
        host: "www.nustandardcleaning.com",
      });
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("host");
    });

    it("no explicit tenant and no host => source default", () => {
      const r = resolver.resolve({});
      expect(r.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(r.source).toBe("default");
    });
  });
});
