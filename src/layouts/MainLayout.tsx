import type { ReactNode } from 'react';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { VerificationBanner } from '../components/VerificationBanner';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7F2] text-[#242B29]">
      <Navbar />
      <VerificationBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
