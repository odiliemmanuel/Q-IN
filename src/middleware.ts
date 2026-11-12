import { NextResponse } from 'next/server'

// This middleware runs on every request to protect routes
export function middleware(request) {
  const path = request.nextUrl.pathname

  // Protect dashboard routes
  if (path.startsWith('/dashboard')) {
    // Check for auth token in cookies or headers
    const token = request.cookies.get('access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // No token - redirect to login
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }

    // Verify token with backend
    try {
      const res = fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!res.ok) {
        // Token invalid - redirect to login
        const url = new URL('/auth/login', request.url)
        url.searchParams.set('redirect', path)
        return NextResponse.redirect(url)
      }

      // Token valid - allow access
      return NextResponse.next()
    } catch (error) {
      console.error('Middleware error:', error)
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }
  }

  // Allow auth routes to be accessed publicly
  if (path.startsWith('/auth')) {
    return NextResponse.next()
  }

  // Allow public routes
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/api/:path*',
  ],
}