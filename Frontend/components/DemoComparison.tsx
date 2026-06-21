'use client';

import { motion } from 'framer-motion';

export function DemoComparison() {
  return (
    <section className="grid gap-6 sm:grid-cols-2">
      {[
        {
          label: 'Before Analysis',
          title: 'Uploaded Image',
          description: 'Clear selfie ready for AI inspection, with skin tone and texture captured precisely.',
          accent: 'from-pink-500/15 to-transparent',
        },
        {
          label: 'After Analysis',
          title: 'AI Results Dashboard',
          description: 'Instant insights including concern detection, confidence score, and product guidance.',
          accent: 'from-purple-500/15 to-transparent',
        },
      ].map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: index * 0.1 }}
          className="glass-card overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">{card.title}</h3>
            </div>
            <div className={`h-14 w-14 rounded-3xl bg-gradient-to-br ${card.accent}`} />
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">{card.description}</p>
          <div className="mt-7 rounded-[1.75rem] bg-slate-950/5 p-5">
            <div className="h-52 rounded-3xl bg-gradient-to-br from-white via-slate-100 to-slate-50" />
          </div>
        </motion.div>
      ))}
    </section>
  );
}
