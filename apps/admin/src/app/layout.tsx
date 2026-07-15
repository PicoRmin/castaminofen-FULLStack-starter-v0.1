import '../styles.css';

export const metadata = {
  title: 'Castaminofen Admin',
  description: 'پنل مدیریتی پیشرفته با احراز هویت، RBAC و ماژول‌های عملیاتی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
