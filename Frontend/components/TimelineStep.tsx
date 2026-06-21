'use client';

import { motion } from 'framer-motion';

interface TimelineStepProps {
  step: string;
  title: string;
  description: string;
  accent: string;
}

export function TimelineStep({ step, title, description, accent }: TimelineStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className="relative flex items-start gap-5 rounded-[2rem] border border-slate-200/60 bg-white/70 p-6 shadow-soft"
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${accent} text-white shadow-lg`}>
        <span className="text-sm font-semibold tracking-[0.25em]">{step}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </motion.div>
  );
}
