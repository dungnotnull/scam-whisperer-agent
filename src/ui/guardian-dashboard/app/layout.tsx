import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scam Whisperer — Family Guardian',
  description: 'Bảng điều khiển giám sát an toàn cho người thân cao tuổi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#1a1a2e' }}>
        {children}
      </body>
    </html>
  );
}
