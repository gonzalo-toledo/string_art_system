// Configuración de next-intl para internacionalización.
// Define los idiomas soportados y carga los archivos de traducción.
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'es', 'pt'];

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as string)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
