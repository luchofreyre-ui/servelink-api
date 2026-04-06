import type { UserRole } from "./authClient";

export function getDefaultRouteForRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "fo":
      return "/fo";
    case "customer":
      return "/customer";
    default:
      return "/";
  }
}

export function getLoginRouteForRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/auth";
    case "fo":
      return "/fo/auth";
    case "customer":
      return "/customer/auth";
    default:
      return "/";
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "fo":
      return "Franchise Owner";
    case "customer":
      return "Customer";
    default:
      return "User";
  }
}
