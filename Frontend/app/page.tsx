'use client';

import { ArrowRight, CheckCircle2, HeartHandshake, Layers, Sparkles, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { SectionHeading } from '@/components/SectionHeading';
import { SkinAnalysis } from '@/components/SkinAnalysis';
import { StatsCard } from '@/components/StatsCard';
import { TimelineStep } from '@/components/TimelineStep';

const features = [
  {
    icon: CheckCircle2,
    title: 'Acne Detection',
    description: 'Detect early breakouts, clogged pores, and acne-prone zones with clinical precision.',
  },
  {
    icon: ShieldCheck,
    title: 'Dark Spot Analysis',
    description: 'Pinpoint pigmentation and discoloration across your complexion in seconds.',
  },
  {
    icon: Layers,
    title: 'Skin Type Classification',
    description: 'Accurate skin type profiling for normal, oily, dry, combination, and sensitive skin.',
  },
  {
    icon: Sparkles,
    title: 'Personalized Recommendations',
    description: 'Tailored product and regimen suggestions based on your unique skin profile.',
  },
  {
    icon: TrendingUp,
    title: 'AI Confidence Score',
    description: 'Measure model certainty to guide trustworthy skincare decisions and routines.',
  },
  {
    icon: Users,
    title: 'Progress Tracking',
    description: 'Monitor changes over time with visual progress snapshots and trend insights.',
  },
];

const timeline = [
  {
    step: '01',
    title: 'Upload Selfie',
    description: 'Capture your skin with a clear selfie and begin the AI inspection journey.',
    accent: 'from-pink-500 to-fuchsia-500',
  },
  {
    step: '02',
    title: 'AI Skin Analysis',
    description: 'Our model analyzes texture, tone, pores, and concerns instantly.',
    accent: 'from-purple-500 to-violet-500',
  },
  {
    step: '03',
    title: 'Generate Report',
    description: 'Receive a clean, professional report with prioritized insights and scores.',
    accent: 'from-indigo-500 to-cyan-500',
  },
  {
    step: '04',
    title: 'Recommendations',
    description: 'Get a curated skincare plan matched to your skin condition and goals.',
    accent: 'from-fuchsia-500 to-pink-500',
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Navbar />
      <section id="home" className="relative overflow-hidden bg-hero-glow px-6 py-6 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-pink-700 shadow-sm shadow-pink-200/70">
              AI skincare intelligence
            </p>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              AI-Powered Skin Analysis in Seconds
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Unlock personalized skincare recommendations and scientific insight from a single selfie—designed for premium beauty, wellness, and healthcare experiences.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#features" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5">
                Analyze My Skin
              </a>
              <a href="#analyze" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                See the Analysis
              </a>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trusted by</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">120+ clinics</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Skin conditions analyzed</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">10+</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-6 h-48 w-48 rounded-full bg-pink-200/40 blur-3xl" />
            <div className="absolute -bottom-10 right-6 h-56 w-56 rounded-full bg-purple-200/40 blur-3xl" />
            <div className="glass-card relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/80 p-6 shadow-soft">
              <div className="mb-6 flex items-center justify-between rounded-3xl bg-slate-950/5 p-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Percepta Dashboard</p>
                  <p className="mt-1 text-xs text-slate-400">AI skin health summary</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">Live</span>
              </div>
              <div className="grid gap-5 rounded-[2rem] bg-slate-950/5 p-5">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" alt="Uploaded face" className="h-56 w-full rounded-[1.75rem] object-cover" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Detected concerns</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">Acne, Redness</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Confidence</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">95%</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-gradient-to-r from-pink-50 to-purple-50 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recommended products</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {['Hydra Serum', 'Barrier Cream', 'AHA Toner'].map((item) => (
                      <span key={item} className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 top-16 hidden h-44 w-44 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 to-transparent blur-3xl md:block" />
            <div className="absolute left-4 top-72 hidden h-32 w-32 rounded-full bg-violet-500/10 blur-3xl md:block" />
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-8 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Features"
            title="Modern skincare intelligence built for trust and clarity"
            description="Experience AI-powered insights, expert-grade reports, and personalized care that feels premium and scientific."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="How it works"
            title="From selfie to skincare plan in four effortless steps"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {timeline.map((step) => (
                <TimelineStep key={step.step} step={step.step} title={step.title} description={step.description} accent={`bg-gradient-to-b ${step.accent}`} />
              ))}
            </div>
            <div className="glass-card rounded-[2.25rem] border border-white/70 bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">AI Process</p>
              <h3 className="mt-4 text-3xl font-semibold text-slate-950">Seamless experience at every step</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Percepta AI combines advanced computer vision and dermatology-informed models to deliver transparent results that patients and professionals trust.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Instant</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">Results in seconds</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Verified</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">Clinically inspired model</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analyze" className="bg-white py-8 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SkinAnalysis />
        </div>
      </section>

      <section className="bg-white py-8 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Statistics"
            title="Proven performance and real adoption metrics"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard value="50,000+" label="Images Analyzed" />
            <StatsCard value="95%" label="Model Accuracy" delay={0.05} />
            <StatsCard value="10+" label="Skin Conditions" delay={0.1} />
            <StatsCard value="24/7" label="AI Assistance" delay={0.15} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
