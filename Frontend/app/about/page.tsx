import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { SectionHeading } from '@/components/SectionHeading';

export default function AboutPage() {
  return (
    <main className="overflow-hidden">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/10">
            <p className="text-sm uppercase tracking-[0.35em] text-pink-300/80">About Percepta</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Advanced skin intelligence for modern beauty and clinical teams
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Percepta combines next-generation computer vision, dermatology-informed insights, and elegant product design to help brands and practitioners deliver clearer, safer, and more personalized skincare journeys.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-pink-300/80">Trust</p>
                <p className="mt-4 text-2xl font-semibold text-white">Clinical rigor</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-pink-300/80">Speed</p>
                <p className="mt-4 text-2xl font-semibold text-white">Instant analysis</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-pink-300/80">Experience</p>
                <p className="mt-4 text-2xl font-semibold text-white">Premium design</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Our mission"
            title="Make skincare decisions easier with clear, science-backed AI"
            description="We design every experience for professionals and consumers who want practical recommendations, transparent results, and confidence in every step."
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50 p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Precision</p>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Dermatology-inspired analysis</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                We engineer models with the patterns experts rely on so every result is relevant, explainable, and aligned with real skincare workflows.
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50 p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Design</p>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Delightful, easy-to-use tools</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Every interface is built for clarity and speed, from image upload to the final recommendations, so teams can focus on results instead of complexity.
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50 p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Impact</p>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Actionable results at scale</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                From clinic consultations to digital wellness experiences, Percepta gives teams the confidence to recommend the right care and retain loyal users.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Why choose us"
            title="A refined AI experience built for skin teams and wellness brands"
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-10 shadow-soft">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Core principles</p>
              <ul className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
                <li className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5">Transparent insight with easy-to-read skin condition summaries.</li>
                <li className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5">Fast, accurate scans that scale across consultations and digital channels.</li>
                <li className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5">Design-first experience that feels premium and trustworthy.</li>
              </ul>
            </div>
            <div className="rounded-[2rem] bg-gradient-to-br from-pink-50 via-white to-purple-50 p-10 shadow-soft">
              <div className="space-y-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Experience</p>
                  <h3 className="mt-4 text-3xl font-semibold text-slate-950">Built for modern teams</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Percepta helps beauty and healthcare teams reduce friction, improve clarity, and deliver recommendations that feel expert and approachable.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Efficient</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">Rapid evaluation</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Reliable</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">Clinically inspired</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
