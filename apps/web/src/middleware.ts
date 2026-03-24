import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SERVELINK_ACCESS_TOKEN_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SERVELINK_ACCESS_TOKEN_COOKIE)?.value;

  if (
    pathname === "/customer/auth" ||
    pathname.startsWith("/customer/auth/")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/fo/auth" || pathname.startsWith("/fo/auth/")) {
    return NextResponse.next();
  }

  if (pathname === "/customer" || pathname.startsWith("/customer/")) {
    if (!token?.trim()) {
      const url = request.nextUrl.clone();
      url.pathname = "/customer/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/fo" || pathname.startsWith("/fo/")) {
    if (!token?.trim()) {
      const url = request.nextUrl.clone();
      url.pathname = "/fo/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer", "/customer/:path*", "/fo", "/fo/:path*"],
};
