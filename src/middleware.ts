// Middleware de next-intl para routing internacionalizado.
// Redirige automáticamente al idioma detectado del browser.
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'pt'],
  defaultLocale: 'es'
});

export const config = {
  // Solo matchear rutas internacionalizadas
  matcher: ['/', '/(es|en|pt)/:path*']
};
