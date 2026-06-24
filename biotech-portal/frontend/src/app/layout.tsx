import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
});

export const metadata: Metadata = {
  title: 'Biotechnology Dept Portal | Federal University Lokoja',
  description: 'Official portal for the Department of Biotechnology, Faculty of Life Sciences, Federal University Lokoja.',
  keywords: 'biotechnology, federal university lokoja, FULokoja, student portal, departmental dues',
  themeColor: '#006400',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans antialiased bg-background">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#006400', secondary: 'white' } },
            error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
          }}
        />
      </body>
    </html>
  );
}
