import './globals.css';
import { ThemeProvider } from '../providers/theme-provider';
import { I18nProvider } from '../providers/i18n-provider';

export const metadata = {
  title: 'Castaminofen Podcast Platform',
  description: 'Production-ready podcast playing and discovery experience',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
