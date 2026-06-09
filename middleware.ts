import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/((?!login|register|reset-password|api/auth|api/businesses|api/register|api/password-reset|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image).*)',
  ],
}
