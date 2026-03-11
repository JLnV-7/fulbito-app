// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define public routes
    const publicRoutes = ['/', '/login', '/signup', '/auth', '/buscar', '/goleadores', '/posiciones', '/fixtures']
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route ||
        pathname.startsWith('/liga/') ||
        pathname.startsWith('/partido/') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.')
    )

    // Debug log for development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] Path: ${pathname} - Public: ${isPublicRoute}`)
    }

    // If it's a public route, just continue
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Basic check for session cookie
    const sessionCookie = request.cookies.get('sb-session-exists')

    if (!sessionCookie) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
