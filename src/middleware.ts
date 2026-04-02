import { NextResponse, type NextRequest } from 'next/server'
import PocketBase from 'pocketbase'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
  const pb = new PocketBase(pbUrl)

  // Load auth stored in cookie
  const cookieHeader = request.headers.get('cookie') || ''
  pb.authStore.loadFromCookie(cookieHeader)

  const isPublic = request.nextUrl.pathname.startsWith('/login')

  if (!pb.authStore.isValid && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (pb.authStore.isValid && isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
