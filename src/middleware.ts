import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'pt'],
  defaultLocale: 'es'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(es|en|pt)/:path*']
};
