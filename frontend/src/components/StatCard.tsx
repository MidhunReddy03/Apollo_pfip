import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-500',
    text: 'text-primary-600',
    lightBg: 'bg-primary-50',
  },
  success: {
    bg: 'bg-success-500',
    text: 'text-success-600',
    lightBg: 'bg-success-50',
  },
  warning: {
    bg: 'bg-warning-500',
    text: 'text-warning-600',
    lightBg: 'bg-warning-50',
  },
  danger: {
    bg: 'bg-danger-500',
    text: 'text-danger-600',
    lightBg: 'bg-danger-50',
  },
};

export default function StatCard({ title, value, icon: Icon, color, trend, delay = 0 }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card hover className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <motion.h3
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: delay + 0.2 }}
                className={cn('text-3xl font-bold', colors.text)}
              >
                <CountUp end={value} duration={2} delay={delay} />
              </motion.h3>
              {trend && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.4 }}
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </motion.span>
              )}
            </div>
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: delay + 0.1 }}
            className={cn('p-3 rounded-xl', colors.lightBg)}
          >
            <Icon className={colors.text} size={24} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
