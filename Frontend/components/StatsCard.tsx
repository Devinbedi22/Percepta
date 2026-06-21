'use client';

import { motion } from 'framer-motion';

interface StatsCardProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatsCard({ value, label, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay }}
      className="glass-card rounded-3xl border border-white/60 bg-white/75 p-6 text-center shadow-soft"
    >
      <p className="text-4xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
    </motion.div>
  );
}
