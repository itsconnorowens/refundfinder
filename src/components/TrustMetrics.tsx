'use client';

import { motion } from 'framer-motion';
import { CheckIcon, MoneyIcon, ClockIcon, UsersIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface MetricCardProps {
  number: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  number, 
  label, 
  icon: Icon, 
  trend, 
  delay = 0 
}) => {
  return (
    <motion.div
      className="text-center p-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        ease: "easeOut"
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon size={24} className="text-blue-600" />
        </div>
      </div>
      <motion.div
        className="text-2xl font-bold text-gray-900 mb-1"
        initial={{ scale: 0.8 }}
        whileInView={{ scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: delay + 0.2,
          ease: "easeOut"
        }}
        viewport={{ once: true }}
      >
        {number}
      </motion.div>
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      {trend && (
        <motion.div
          className="text-xs text-green-600 font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ 
            duration: 0.4, 
            delay: delay + 0.4 
          }}
          viewport={{ once: true }}
        >
          {trend}
        </motion.div>
      )}
    </motion.div>
  );
};

export const TrustMetrics: React.FC = () => {
  const { currency } = useCurrency();

  // Hard-coded region-specific metrics
  const metrics = {
    EUR: {
      totalRecovered: '€147,000',
      monthlyTrend: '+€23,000 this month'
    },
    USD: {
      totalRecovered: '$158,760',
      monthlyTrend: '+$25,000 this month'
    },
    GBP: {
      totalRecovered: '£125,000',
      monthlyTrend: '+£20,000 this month'
    }
  };

  const currentMetrics = metrics[currency];

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm p-6 mb-8"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="text-center mb-6">
        <motion.h3
          className="text-lg font-semibold text-gray-900 mb-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Trusted by Travelers Worldwide
        </motion.h3>
        <motion.p
          className="text-sm text-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Join thousands of successful travelers who've recovered their compensation
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard
          number="320+"
          label="Successful Claims"
          icon={UsersIcon}
          trend="+12% this month"
          delay={0}
        />
        <MetricCard
          number={currentMetrics.totalRecovered}
          label="Total Recovered"
          icon={MoneyIcon}
          trend={currentMetrics.monthlyTrend}
          delay={0.1}
        />
        <MetricCard
          number="94%"
          label="Success Rate"
          icon={CheckIcon}
          trend="+2% this month"
          delay={0.2}
        />
        <MetricCard
          number="3.2 weeks"
          label="Avg. Processing"
          icon={ClockIcon}
          trend="-0.5 weeks this month"
          delay={0.3}
        />
      </div>
    </motion.div>
  );
};
