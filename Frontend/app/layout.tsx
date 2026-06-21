import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: 'Percepta AI — Skin Analysis',
  description: 'AI-powered skin analysis with personalized recommendations and confidence-driven skincare insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
