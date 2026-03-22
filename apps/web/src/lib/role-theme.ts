export type RoleTheme = {
  id: "admin" | "fo" | "customer";
  pageBg: string;
  accent: string;
};

export const roleThemes: Record<RoleTheme["id"], RoleTheme> = {
  admin: { id: "admin", pageBg: "bg-slate-50", accent: "text-slate-900" },
  fo: { id: "fo", pageBg: "bg-blue-50/30", accent: "text-blue-950" },
  customer: { id: "customer", pageBg: "bg-white", accent: "text-slate-900" },
};
