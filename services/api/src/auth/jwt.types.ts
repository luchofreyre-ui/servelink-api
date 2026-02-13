export type JwtRole = "customer" | "fo" | "admin";

export type JwtAccessPayload = {
  email: string;
  role: JwtRole;
};
