import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-token";

/*
 * Optimistic gate for the private Content Studio.
 * Every Studio page and API route additionally verifies the session on the server.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/studio")) {
    if (!session) return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    return NextResponse.next();
  }

  const isLogin = pathname === "/content-studio/login";
  if (!session && !isLogin) {
    const url = new URL("/content-studio/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/content-studio", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // The upload endpoint is excluded so large files are not buffered by the proxy;
  // it checks the session itself.
  matcher: ["/content-studio", "/content-studio/:path*", "/api/studio/((?!media/upload).*)"],
};
