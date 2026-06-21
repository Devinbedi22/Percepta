'use client';

import { motion } from 'framer-motion';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  image: string;
  delay?: number;
}

export function TestimonialCard({ quote, name, role, image, delay = 0 }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay }}
      className="glass-card flex h-full flex-col justify-between rounded-3xl border border-white/70 bg-white/75 p-6 shadow-soft"
    >
      <div>
        <p className="text-base leading-7 text-slate-700">“{quote}”</p>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-3xl bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
          <img src={image} alt={`${name} profile`} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-semibold text-slate-950">{name}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}
