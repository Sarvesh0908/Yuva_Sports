import React from 'react';
import { motion } from 'framer-motion';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'saffron',
  onClick,
  className = ''
}) {
  const variantStyles = {
    saffron: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 icon-bg:bg-orange-500/20',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 icon-bg:bg-emerald-500/20',
    rose: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 icon-bg:bg-rose-500/20',
    amber: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 icon-bg:bg-amber-500/20',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 icon-bg:bg-blue-500/20',
    purple: 'from-purple-500/10 to-violet-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 icon-bg:bg-purple-500/20'
  };

  const currentVariant = variantStyles[variant] || variantStyles.saffron;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br bg-white dark:bg-slate-900 border p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-festive' : ''
      } ${currentVariant} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 pr-2">
          <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-current flex-shrink-0">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Subtle bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20" />
    </motion.div>
  );
}

export default StatCard;
