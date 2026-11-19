import { Link } from 'react-router-dom';
import { MVP_SERVICE_FEE_INR } from '../constants/marketplace';
import { MainLayout } from '../layouts/MainLayout';

export function AboutPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        <header className="border-b border-[#DDD7C9] pb-8">
          <p className="text-xs font-semibold tracking-wide text-[#2F8065]">
            DBS Global University · Entrepreneurship &amp; Innovation Capstone
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#242B29] sm:text-4xl">
            About ReNest Campus
          </h1>
          <p className="mt-3 text-base text-[#525C58] leading-relaxed">
            Buy Smart. Sell Easy. Reuse Together. ReNest Campus is a student-focused circular
            marketplace helping university students buy, sell, and transfer usable room
            essentials when moving into or out of hostels, PGs, and rented flats.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#DDD7C9] bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-[#242B29]">
              The Move-Out Friction We Solve
            </h2>
            <p className="mt-2.5 text-sm text-[#525C58] leading-relaxed">
              Students living in hostels, PGs, and rented accommodation near DBS Global
              University in Dehradun regularly purchase study tables, electric kettles, lamps,
              books, and storage units. At the end of a semester or academic year, fragmented
              WhatsApp groups and generic classifieds make finding trusted student buyers hard,
              leading to last-minute low-value sales or usable goods being left behind.
            </p>
          </div>

          <div className="rounded-xl border border-[#DDD7C9] bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-[#242B29]">
              Geographic Focus &amp; Scalability
            </h2>
            <p className="mt-2.5 text-sm text-[#525C58] leading-relaxed">
              Our beachhead launch focuses on DBS Global University campus and nearby student
              accommodation clusters across Selaqui, Prem Nagar, Sudhowala, Bidholi, and Pondha
              in Dehradun, Uttarakhand — while supporting open registration for students from
              neighbouring colleges and universities.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDD7C9] bg-[#EDE9DF]/70 p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-[#242B29]">
            MVP Scope &amp; ₹{MVP_SERVICE_FEE_INR} Planning Assumption
          </h2>
          <p className="mt-2.5 text-sm text-[#525C58] leading-relaxed">
            As an MVP validation platform, ReNest Campus focuses on reliable listing discovery,
            private buyer-to-seller enquiries, atomic item reservation, and coordinated local
            handovers. Automated payment gateways and refunds are intentionally excluded from
            Version 1; the proposed{' '}
            <strong className="font-mono text-[#242B29]">₹{MVP_SERVICE_FEE_INR}</strong>{' '}
            service fee is shown transparently on handover records as a business-model planning
            assumption.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/marketplace"
              className="rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065]"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/sell"
              className="rounded-lg border border-[#174C3C] bg-white px-5 py-2.5 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF]"
            >
              Post an Item
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
