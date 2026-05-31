import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';
import '../globals.css';

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#111111'
      }}>
        <NextIntlClientProvider messages={messages}>
          <AppHeader locale={locale} />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          <AppFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
