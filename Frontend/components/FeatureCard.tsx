'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay }}
      className="glass-card group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 shadow-soft backdrop-blur-xl hover:-translate-y-1 hover:border-pink-300/40 hover:bg-white/90"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-pink-50 text-pink-600 shadow-sm transition-all duration-300 group-hover:bg-pink-100">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 via-white/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}
