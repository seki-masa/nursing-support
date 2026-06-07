import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/((?!login|register|api/auth|api/businesses|api/register|_next/static|_next/image|favicon.ico).*)',
  ],
}
