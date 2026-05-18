export default function middleware(request) {
  const response = Response.next()
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none')
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  return response
}

export const config = {
  matcher: ['/((?!api/.*).*)'],
}
