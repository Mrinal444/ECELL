import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () => {
  const secret = process.env.JWT_SECRET || "super-secret-jwt-key-change-me";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // App routes (API, discover, requests, profile, etc.)
  const session = request.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(session, getSecret(), {
      algorithms: ["HS256"],
    });

    if (!payload.userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (err) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
