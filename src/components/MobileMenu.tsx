'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneIcon } from './icons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const handleCTAClick = () => {
    const formSection = document.querySelector('#eligibility-form');
    formSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl z-50"
          >
            {/* Logo & Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <PlaneIcon size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Flghtly</h2>
                  <p className="text-xs text-gray-500 -mt-0.5">Compensation made simple</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="mt-4 px-6">
              <ul className="space-y-2">
                <li>
                  <a
                    href="#how-it-works"
                    onClick={onClose}
                    className="block py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    onClick={onClose}
                    className="block py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    onClick={onClose}
                    className="block py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>

              {/* CTA Button */}
              <div className="mt-6">
                <button
                  onClick={handleCTAClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Check Eligibility
                </button>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
