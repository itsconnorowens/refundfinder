'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleNavClick = (sectionId: string) => {
    const section = document.querySelector(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                <img
                  src="/icon-192.png"
                  alt="Flghtly Logo"
                  className="w-10 h-10 rounded-xl shadow-md"
                />
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
                  <button
                    onClick={() => handleNavClick('#how-it-works')}
                    className="block w-full text-left py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('#pricing')}
                    className="block w-full text-left py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('#faq')}
                    className="block w-full text-left py-3 text-base font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    FAQ
                  </button>
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
