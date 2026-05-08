import {
  parseServiceMatrixShadowConfig,
  shouldRunServiceMatrixShadow,
} from "../src/modules/service-matrix/service-matrix-shadow-config";

describe("service-matrix-shadow-config", () => {
  const cleanEnv = () => {
    delete process.env.ENABLE_SERVICE_MATRIX_SHADOW;
    delete process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE;
    delete process.env.SERVICE_MATRIX_SHADOW_SURFACES;
  };

  beforeEach(() => cleanEnv());
  afterEach(() => cleanEnv());

  it("default env disables shadow (master off, sample 0)", () => {
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.masterEnabled).toBe(false);
    expect(cfg.sampleRate).toBe(0);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(false);
  });

  it("master false disables even with sample rate 1", () => {
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.masterEnabled).toBe(false);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(false);
  });

  it("sample rate 0 disables when master on", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "0";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.masterEnabled).toBe(true);
    expect(cfg.sampleRate).toBe(0);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(false);
  });

  it("excluded surface disables", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "1";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "dispatch,slots";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(false);
    expect(shouldRunServiceMatrixShadow(cfg, "dispatch", 0)).toBe(true);
  });

  it("included surface + sample pass enables public_booking", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0.2)).toBe(true);
  });

  it("randomValue controls deterministic sampling", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "0.5";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0.4)).toBe(true);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0.5)).toBe(false);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0.9)).toBe(false);
  });

  it("malformed sample rate safely disables", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "not-a-number";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.sampleRate).toBe(0);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(false);
  });

  it("whitespace and case on master flag are safe", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = " TRUE ";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = " 1 ";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = " Public_Booking ";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.masterEnabled).toBe(true);
    expect(cfg.sampleRate).toBe(1);
    expect(cfg.surfaces.has("public_booking")).toBe(true);
    expect(shouldRunServiceMatrixShadow(cfg, "public_booking", 0)).toBe(true);
  });

  it("rejects sample rate > 1 as 0", () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1.01";
    const cfg = parseServiceMatrixShadowConfig(process.env);
    expect(cfg.sampleRate).toBe(0);
  });
});
